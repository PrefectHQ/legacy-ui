<script>
import SearchResult from '@/components/Schematics/Preview-SearchResult'

// Type content
import StaticPreview from '@/components/Schematics/Preview-Static'
import DynamicPreview from '@/components/Schematics/Preview-Dynamic'

export default {
  components: {
    SearchResult,
    DynamicPreview,
    StaticPreview
  },
  props: {
    options: {
      type: Array,
      required: false,
      default: () => []
    },
    tasks: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      runs: null,
      search: null,
      searchInput: null,
      showDetails: true,
      task: null
    }
  },
  computed: {
    isRun() {
      return this.tasks?.[0].__typename == 'task_run'
    }
  },
  watch: {
    '$route.query.schematic'(val) {
      if (!val) {
        this.task = null
        this.searchInput = null
      } else {
        this.updatePreview()
      }
    },
    searchInput(val) {
      let selected = this.options.find(opt => opt.name == val)
      if (selected) this.handleSelect(selected)
    },
    tasks() {
      if (!this.$route.query.schematic) {
        this.task = null
      } else {
        this.updatePreview()
      }
    }
  },
  mounted() {
    if (!this.$route.query.schematic) return
    this.updatePreview()
  },
  methods: {
    handleBlur() {
      this.showDetails = true
    },
    handleClear() {
      this.$emit('clear-task')
    },
    handleFocus() {
      this.showDetails = false
    },
    handleSelect(task) {
      this.$emit('select-task', task)
    },
    searchFilter(item, queryText) {
      // This is the filter we use to determine what the VAutocomplete
      // method is showing. We transform all queries to lowercase
      // for comparison for a better UX
      return (
        item['id'].toLowerCase().includes(queryText.toLowerCase()) ||
        item['name'].toLowerCase().includes(queryText.toLowerCase())
      )
    },
    updatePreview() {
      if (!this.isRun) {
        this.task = this.tasks.find(
          task => task.id == this.$route.query.schematic
        )
        return
      }

      let runs = this.tasks.filter(
        task => task.task.id == this.$route.query.schematic
      )

      let index =
        runs.length > 1 ? runs.findIndex(task => task.state == 'Mapped') : 0

      this.task = runs.splice(index, 1)[0]
      this.runs = runs
    }
  }
}
</script>

<template>
  <v-card class="preview-tile" tile>
    <v-autocomplete
      data-public
      v-model="searchInput"
      autocomplete="new-password"
      class="mx-0 py-0"
      auto-select-first
      background-color="appForeground"
      hide-details
      single-line
      flat
      solo
      dense
      clearable
      :items="options"
      :search-input.sync="search"
      :filter="searchFilter"
      placeholder="Search for a task"
      prepend-inner-icon="search"
      item-text="name"
      disable-lookup
      @blur="handleBlur"
      @change="handleBlur"
      @click:clear="handleClear"
      @focus="handleFocus"
    >
      <template v-if="search == null" #no-data>
        <v-list-item>
          <v-list-item-title>
            Type to search for a <strong>Task</strong> by
            <strong>name</strong> or <strong>id</strong>
          </v-list-item-title>
        </v-list-item>
      </template>
      <template v-else #no-data>
        <v-list-item>
          <v-list-item-title>
            No results matched your search.
          </v-list-item-title>
        </v-list-item>
      </template>
      <template #item="data">
        <v-lazy
          :options="{
            threshold: 0.75
          }"
          min-height="40px"
          transition="fade"
        >
          <SearchResult
            v-if="data"
            :search-result="data.item"
            :parent="data.parent"
          />
        </v-lazy>
      </template>
    </v-autocomplete>

    <DynamicPreview
      v-if="task && isRun && showDetails"
      :runs="runs"
      :task="task"
    />
    <StaticPreview v-else-if="task && showDetails" :task="task" />
  </v-card>
</template>

<style lang="scss" scoped>
$width: 25rem;

.preview-tile {
  width: 100%;
}

.search-input {
  font-size: 1rem;
  height: 2rem;
  max-width: $width;
}

.v-select-list {
  max-width: $width;
}
</style>
