<script>
import LastTenRuns from '@/components/LastTenRuns'
import CardTitle from '@/components/Card-Title'
import { mapGetters } from 'vuex'
import moment from 'moment'
import { flowRunHistoryMixin } from '@/mixins/flowRunHistoryMixin'
import { formatTime } from '@/mixins/formatTimeMixin'

const serverHeaders = [
  {
    text: '',
    value: 'archived',
    sortable: false,
    width: '5%'
  },
  {
    text: 'Version',
    value: 'version',
    width: '10%'
  },
  {
    text: 'Created',
    value: 'created',
    width: '15%'
  }
]

const serverHeadersPost = [
  {
    text: 'Last runs',
    value: 'flow_runs',
    sortable: false,
    width: '25%'
  }
]

const cloudHeaders = [
  {
    text: 'Created By',
    value: 'created_by.username',
    width: '15%'
  }
]

export default {
  components: {
    CardTitle,
    LastTenRuns
  },
  mixins: [formatTime, flowRunHistoryMixin],
  props: {
    flowGroupId: {
      required: true,
      type: String
    }
  },
  data() {
    return {
      itemsPerPage: 5,
      loading: 0,
      page: 1,
      runsLoadingKey: 0,
      searchTerm: null,
      sortBy: 'version',
      sortDesc: true,
      tooltip: null
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    headers() {
      return [
        ...serverHeaders,
        ...(this.isCloud ? cloudHeaders : []),
        ...serverHeadersPost
      ]
    },
    offset() {
      return this.itemsPerPage * (this.page - 1)
    },
    runsLoading() {
      return this.runsLoadingKey > 0
    },
    searchFormatted() {
      if (!this.searchTerm) return null
      return parseInt(this.searchTerm)
    }
  },
  watch: {
    itemsPerPage() {
      this.$apollo.queries.versionsRuns.refetch()
    }
  },
  methods: {
    getFlow(flowId) {
      if (!this.versions || !this.versionsRuns) return
      return this.versionsRuns.find(flow => flow.id == flowId)
    },
    prepFlowRuns(flowId) {
      if (!this.versions || !this.versionsRuns) return []
      let flow = this.getFlow(flowId)
      if (!flow) return []

      const computedStyle = getComputedStyle(document.documentElement)

      return [...flow.flow_runs].reverse().map(d => {
        if (d.start_time && d.end_time) {
          let end = new moment(d.end_time),
            start = new moment(d.start_time)
          d.duration = moment.duration(end.diff(start))
        } else {
          let now = new moment(),
            start = new moment(d.start_time)
          d.duration = moment.duration(now.diff(start))
        }

        d.color = computedStyle.getPropertyValue(`--v-${d.state}-base`)
        d.opacity = d.start_time ? 0 : 1
        d.flow_id = flowId
        return d
      })
    },
    onIntersect([entry]) {
      this.$apollo.queries.versions.skip = !entry.isIntersecting
      this.$apollo.queries.versionsCount.skip = !entry.isIntersecting
    }
  },
  apollo: {
    versions: {
      query() {
        return require('@/graphql/Flow/flow-versions.js').default(this.isCloud)
      },
      variables() {
        return {
          flow_group_id: this.flowGroupId,
          limit: this.itemsPerPage,
          offset: this.offset,
          order_by: { [this.sortBy]: this.sortDesc ? 'desc' : 'asc' },
          search: this.searchFormatted
        }
      },
      loadingKey: 'loading',
      update: data => data?.flow_group_by_pk?.flows,
      pollInterval: 10000
    },
    versionsCount: {
      query: require('@/graphql/Flow/flow-versions-count.gql'),
      variables() {
        return {
          flow_group_id: this.flowGroupId,
          search: this.searchFormatted
        }
      },
      loadingKey: 'loading',
      update: data => data?.flow_group_by_pk?.flows_aggregate?.aggregate?.count,
      pollInterval: 10000
    }
  }
}
</script>

<template>
  <v-card v-intersect="{ handler: onIntersect }" class="pa-2 mt-2" tile>
    <CardTitle title="Flow Versions" icon="loop">
      <v-text-field
        slot="action"
        v-model="searchTerm"
        class="search"
        dense
        flat
        solo
        prepend-inner-icon="search"
        placeholder="Search by Version"
        hide-details
        style="min-width: 400px;"
      >
      </v-text-field>
    </CardTitle>

    <v-card-text class="pa-0">
      <v-data-table
        class="ma-2 overflow-table"
        :header-props="{ 'sort-icon': 'arrow_drop_up' }"
        :headers="headers"
        :items="versions"
        :loading="loading > 0"
        must-sort
        :page.sync="page"
        :server-items-length="versionsCount"
        :sort-by.sync="sortBy"
        :sort-desc.sync="sortDesc"
        :items-per-page.sync="itemsPerPage"
        :footer-props="{
          showFirstLastPage: true,
          itemsPerPageOptions: [10, 15, 20],
          firstIcon: 'first_page',
          lastIcon: 'last_page',
          prevIcon: 'keyboard_arrow_left',
          nextIcon: 'keyboard_arrow_right'
        }"
        :class="{ 'fixed-table': $vuetify.breakpoint.smAndUp }"
        calculate-widths
      >
        <template #item.version="{ item }">
          <truncate :content="item.version">
            <router-link
              class="link"
              :to="{
                name: 'flow',
                params: { id: flowGroupId, tenant: tenant.slug },
                query: { version: item.version }
              }"
            >
              {{ item.version }}
            </router-link>
          </truncate>
        </template>

        <template #item.created="{ item }">
          <truncate :content="formatTime(item.created)">
            {{ formDate(item.created) }}
          </truncate>
        </template>

        <template #item.archived="{ item }">
          <truncate :content="item.archived ? 'Archived' : 'Active'">
            <v-icon small dark :color="item.archived ? 'accentPink' : 'green'">
              {{ item.archived ? 'archive' : 'pi-flow' }}
            </v-icon>
          </truncate>
        </template>

        <template #item.flow_runs="{ item }">
          <div class="position-relative allow-overflow" style="height: 55px;">
            <LastTenRuns :flow-id="item.id" :archived="item.archived" />
          </div>
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.search {
  border-radius: 0 !important;
  font-size: 0.85rem;

  .v-icon {
    font-size: 20px !important;
  }
}
</style>
