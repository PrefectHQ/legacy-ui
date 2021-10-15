<script>
import globalNameSearchQuery from '@/graphql/GlobalSearch/search-by-name.gql'
import globalIDSearchQuery from '@/graphql/GlobalSearch/search-by-id.gql'
import GlobalSearchIcon from '@/components/GlobalSearchBar/GlobalSearchIcon'
import GlobalSearchResult from '@/components/GlobalSearchBar/GlobalSearchResult'
import MResult from '@/components/GlobalSearchBar/MResult'
import { mapGetters } from 'vuex'
import HavingTrouble from '@/components/HavingTrouble'

export default {
  components: { HavingTrouble, GlobalSearchIcon, GlobalSearchResult, MResult },
  data() {
    return {
      activateTimeout: null,
      active: false,
      input: null,
      model: null,
      search: null,
      results: [],
      isLoading: false,
      mResult: false
    }
  },
  computed: {
    ...mapGetters('api', ['connected']),
    ...mapGetters('tenant', ['tenant']),
    id() {
      if (!this.input) return ''

      // Call .trim() to get rid of whitespace on the ends of the
      // string before making the query
      return `${this.input.trim()}`
    },
    isSearchForID() {
      const UUIDRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/

      // Call .trim() to get rid of whitespace on the ends of the
      // string before making the query
      return UUIDRegex.test(this.input.trim())
    },
    name() {
      if (!this.input) return ''
      // Call .trim() to get rid of whitespace on the ends of the
      // string before making the query
      return `%${this.input.trim()}%`
    },
    entries() {
      return this.results
    }
  },
  watch: {
    search(val) {
      this.handleSearch(val)
    },
    model(val) {
      this.handleResultSelected(val)
    }
  },
  mounted() {
    // Adds the event listener for the / search shortcut
    window.addEventListener('keyup', this.handleKeyboardShortcut)
  },
  beforeDestroy() {
    // Removes the / search shortcut event listener when
    // the component is destroyed
    window.removeEventListener('keyup', this.handleKeyboardShortcut)
  },
  methods: {
    _activate() {
      clearTimeout(this.activateTimeout)
      this.active = true

      // Wait till the animation has finished
      this.activateTimeout = setTimeout(() => {
        // We can no longer use the onClick method because
        // it requires a click event to work properly
        this.$refs['global-search'].activateMenu()
        this.$refs['global-search'].focus()
      }, 250)
    },
    _deactivate() {
      clearTimeout(this.activateTimeout)
      this.$refs['global-search'].reset()

      this.input = null
      this.model = null
      this.search = null
      this.results = []

      this.activateTimeout = setTimeout(() => {
        this.active = false
      }, 100)
    },
    handleKeyboardShortcut(e) {
      if (
        e.key &&
        e.key === '/' &&
        e.srcElement.tagName !== 'INPUT' &&
        e.srcElement.tagName !== 'TEXTAREA'
      ) {
        this._activate()
      }
    },
    handleSearch(input) {
      // We set the input prop to null if the input
      // string is empty, to bring back up the searchbox hint
      this.input = input == '' ? null : input

      // If there's no input or apollo has been told to
      // pause all queries elsewhere (the skipAll prop),
      // we pause the individual queries and
      // remove all results. This will show the typing hint
      // again if the user has focused the global search focus
      if (!input || this.$apollo.skipAll) {
        this.$apollo.queries.nameQuery.skip = true
        this.$apollo.queries.idQuery.skip = true
        this.results = []
        return
      }
      this.mResult = input == 'about:Prefect' ? true : false

      // Once we've confirmed that we have input and
      // we aren't pausing all queries, we check that
      // the input matches a UUID regex which is stored as
      // a computed prop called isSearchForID
      // If that's the case, we start an id query and
      // pause the name query.
      if (this.isSearchForID) {
        this.startQuery('id')
        this.$apollo.queries.nameQuery.skip = true
      }
      // Otherwise, we start a name query and pause
      // the id query.
      else {
        this.startQuery('name')
        this.$apollo.queries.idQuery.skip = true
      }
    },
    async handleResultSelected(searchResultName) {
      // If this is called with no argument
      // we return immediately
      if (!searchResultName) return

      // The search result that we use is found in the
      // entries on name, since the VAutocomplete
      // component will always pass the name prop to this
      // method regardless of the query used (id or name)
      let searchResult = this.entries.find(
        result => result.name == searchResultName
      )

      // Pause all queries
      this.$apollo.skipAll = true

      const routeToNavigateTo = this.routeName(searchResult.__typename)

      // Navigate to the URL based on the search result
      await this.$router.push({
        name: routeToNavigateTo,
        params: { id: searchResult.id, tenant: this.tenant.slug }
      })

      this._deactivate()
    },
    routeName(name) {
      switch (name) {
        case 'flow':
          return 'flow'
        // Since no actual routes exist for projects
        // we just return the dashboard route
        // when a project is selected.
        case 'project':
          return 'project'
        case 'task':
          return 'task'
        case 'flow_run':
          return 'flow-run'
        case 'task_run':
          return 'task-run'
        default:
          throw new Error('Unable to resolve route, GlobalSearchResult')
      }
    },
    startQuery(ref) {
      this.isLoading = true
      // We make sure to unpause this query before
      // we try to refetch the data
      this.$apollo.queries[`${ref}Query`].skip = false
      this.$apollo.queries[`${ref}Query`].refetch()
    },
    processResult(data, loading) {
      this.isLoading = loading
      // Returning if GraphQL is loading the query still
      // leads to a better UX since the search results
      // don't flicker between loading states
      // i.e. we maintain is loading until GraphQL
      // has determined loading is finished NOT
      // when we've received some data
      if (this.isLoading) return

      this.results = data
        ? Object.entries(data)
            .map(e => e[1].map(e1 => (e1 ? { ...e1 } : [])))
            .flat()
        : []
    },
    searchFilter(item, queryText) {
      // This is the filter we use to determine what the VAutocomplete
      // method is showing. We transform all queries to lowercase
      // for comparison for a better UX
      return (
        item['id'].toLowerCase().includes(queryText.toLowerCase()) ||
        item['name'].toLowerCase().includes(queryText.toLowerCase()) ||
        item['flow_id'].toLowerCase().includes(queryText.toLowerCase())
      )
    }
  },
  apollo: {
    idQuery: {
      query: globalIDSearchQuery,
      manual: true,
      debounce: 300,
      fetchPolicy: 'no-cache',
      variables() {
        return { id: this.id }
      },
      result({ data, loading }) {
        this.processResult(data, loading)
      },
      skip: true
    },
    nameQuery: {
      query: globalNameSearchQuery,
      manual: true,
      debounce: 300,
      fetchPolicy: 'no-cache',
      variables() {
        return { name: this.name }
      },
      result({ data, loading }) {
        this.processResult(data, loading)
      },
      skip: true
    }
  }
}
</script>

<template>
  <div
    class="d-flex align-center justify-end global-search-container"
    :class="{ 'justify-center': active }"
  >
    <v-btn
      class="mx-1 global-search-activator cursor-pointer"
      :icon="$vuetify.breakpoint.smAndUp"
      :class="{
        active: active,
        'navbar-icon': $vuetify.breakpoint.smAndUp,
        fixed: $vuetify.breakpoint.xsOnly
      }"
      title="Search your team for projects, flows, and runs"
      :absolute="$vuetify.breakpoint.xsOnly"
      :fab="$vuetify.breakpoint.xsOnly"
      :elevation="$vuetify.breakpoint.xsOnly ? 2 : null"
      @click.native="_activate"
    >
      <i class="fad fa-search fa-2x nav-bar-duotone-icon" />
    </v-btn>

    <div
      class="global-search"
      :class="{ active: active, fixed: $vuetify.breakpoint.xsOnly }"
    >
      <v-autocomplete
        v-if="active"
        ref="global-search"
        v-model="model"
        single-line
        dense
        outlined
        multiple
        :dark="$vuetify.breakpoint.smAndUp"
        clearable
        :menu-props="{
          closeOnContentClick: false,
          closeOnClick: false
        }"
        :items="entries"
        :loading="isLoading ? 'green accent-3' : false"
        :search-input.sync="search"
        :filter="searchFilter"
        label="Search"
        placeholder="Search"
        item-text="name"
        hide-details
        clear-icon="close"
        open-on-clear
        @blur="_deactivate"
        @clear="results = []"
        @focus="
          results = []
          handleSearch(input)
        "
      >
        <template #no-data>
          <div
            v-if="!connected"
            class="text-subtitle-1 pa-4"
            style="width: 500px;"
          >
            <div class="font-weight-light">
              You aren't connected, so you won't be able to search for
              anything...
            </div>

            <v-divider class="my-6 mx-6" />

            <HavingTrouble />
          </div>

          <v-list-item v-else-if="input == null">
            <v-list-item-title class="text-subtitle-1 font-weight-light">
              Type to search for a <strong>Project</strong>,
              <strong>Flow</strong>, <strong>Task</strong>, or
              <strong>Run</strong>
            </v-list-item-title>
          </v-list-item>

          <v-list-item v-else-if="isLoading">
            <v-list-item-title>
              Searching...
            </v-list-item-title>
          </v-list-item>

          <MResult v-else-if="mResult" />
          <v-list-item v-else>
            <v-list-item-title>
              No results matched your search.
            </v-list-item-title>
          </v-list-item>
        </template>

        <template #item="data">
          <GlobalSearchIcon v-if="data" :type="data.item.__typename" />
          <GlobalSearchResult
            v-if="data"
            ref="result"
            :search-result="data.item"
            :parent="data.parent"
          />
        </template>
      </v-autocomplete>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.global-search-container {
  height: 100%;
  max-width: 500px;
  transition: all 250ms;
}

.global-search-activator {
  &.fixed {
    background-color: var(--v-primary-base);
    position: fixed;
    right: 10px;
    top: 114px;
    transition: all 250ms;
    z-index: 4;

    &.active {
      right: calc(100% - 74px);
    }
  }
}

.global-search {
  background-color: rgba(255, 255, 255, 0.1);
  font-size: 1rem;
  max-width: 500px;
  transition: all 250ms;
  width: 0;

  &.active {
    width: 100%;
  }

  &.fixed {
    background-color: rgba(255, 255, 255, 1);
    left: 74px;
    max-width: calc(100% - 84px);
    position: fixed;
    top: 120px;
    // right: 10px;
    z-index: 4;
  }
}

.v-select-list {
  max-width: 500px !important;
  width: 100% !important;
}
</style>
