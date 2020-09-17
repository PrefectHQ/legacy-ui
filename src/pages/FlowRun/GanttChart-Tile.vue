<script>
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
// import GanttChart from '@/components/Visualizations/GanttChart'
// import SearchResult from '@/components/Schematics/Preview-SearchResult'

import moment from 'moment'
import gql from 'graphql-tag'

export default {
  components: {
    CardTitle,
    DurationSpan
    // GanttChart,
    // SearchResult
  },
  props: {
    flowId: {
      type: String,
      required: true
    },
    flowRunId: {
      type: String,
      required: true
    },
    flowRun: {
      type: Object,
      required: false,
      default: () => {}
    }
  },
  data() {
    return {
      computedStyle: getComputedStyle(document.documentElement),
      taskMap: {},
      search: null,
      searchInput: null,
      selectedTaskIds: []
    }
  },
  computed: {
    hasSelectedTaskIds() {
      return this.selectedTaskIds?.length > 0
    },
    items() {
      if (!this.taskRuns) return
      let items

      if (this.showMapped) {
        const id = this.selectedTaskIds[0]
        items = this.taskRuns.filter(
          task => task.task_id == id && task.state !== 'Mapped'
        )
      } else if (this.hasSelectedTaskIds) {
        items = this.taskRuns.filter(
          task =>
            this.selectedTaskIds.includes(task.task_id) && task.map_index === -1
        )
      } else {
        items = this.taskRuns.filter(task => task.map_index === -1)
      }

      items.forEach(item => {
        const task = this.tasks?.find(t => t.id == item.task_id)

        item.color = this.computedStyle.getPropertyValue(
          `--v-${item.state}-base`
        )

        item.shadow = item.state === 'Running'
        item.name =
          task.name + (item.map_index > -1 ? ` (${item.map_index})` : '')

        if (
          item.state === 'Mapped' ||
          (item.map_index > -1 && !item.start_time)
        ) {
          const mappedRuns = this.taskRuns.filter(
            t => t.task_id == item.task_id && t.start_time
          )

          let start_moments = mappedRuns.map(t => moment(t.start_time))

          item.start_time = moment.min(start_moments).toISOString()

          if (item.state === 'Mapped') {
            let end_moments = mappedRuns.map(t => moment(t.end_time))
            item.end_time = moment.max(end_moments).toISOString()
          } else {
            item.end_time = moment(item.start_time)
              .add({ seconds: 1 })
              .toISOString()
          }
        }
      })

      return items
    },
    endTime() {
      if (this.hasSelectedTaskIds && this.items?.length > 0) {
        let end_moments = this.items
          .filter(t => t.end_time)
          .map(t => moment(t.end_time))
        return moment.max(end_moments).toISOString()
      }
      return this.flowRun.end_time
    },
    startTime() {
      if (this.hasSelectedTaskIds && this.items?.length > 0) {
        let start_moments = this.items
          .filter(t => t.start_time)
          .map(t => moment(t.start_time))
        return moment.min(start_moments).toISOString()
      }
      return this.flowRun.start_time
    },
    pollInterval() {
      return this.flowRun.state === 'Running' ? 1000 : 0
    },
    showMapped() {
      return this.selectedTaskIds.length === 1
    },
    mappedTaskRuns() {
      return this.taskRuns?.filter(taskRun => taskRun.state == 'Mapped')
    },
    mappedChildrenQuery() {
      return this.mappedTaskRuns
        ?.map(
          (taskRun, index) => `
         mapped_run_${index}: mapped_children(task_run_id: "${taskRun.id}") {
            max_end_time
            min_start_time
            state_counts
          }
      `
        )
        .join(' ')
    }
  },
  watch: {
    flowRun() {
      this.$apollo.queries.taskRuns.stopPolling()

      if (this.pollInterval > 0) {
        this.$apollo.queries.taskRuns.startPolling(this.pollInterval)
      } else {
        this.$apollo.queries.taskRuns.refetch()
      }
    },
    searchInput(val) {
      let selected = this.tasks?.find(task => task.name == val)
      if (selected) this._handleSearch(selected.id)
    },
    selectedTaskIds(val) {
      this.$router.push({
        query: {
          chart: val.join(',')
        }
      })
    }
  },
  mounted() {
    if (this.$route.query.chart) {
      try {
        this.selectedTaskIds = this.$route.query.chart.split(',')
      } catch {
        this.$router.push({
          query: {
            chart: null
          }
        })
      }
    }
  },
  methods: {
    _handleClick(data) {
      if (data) {
        this.selectedTaskIds = [data?.task_id]
      }
    },
    removeSelectedTask(item) {
      const index = this.selectedTaskIds.indexOf(item.id)
      if (index >= 0) this.selectedTaskIds.splice(index, 1)
    },
    searchFilter(item, queryText) {
      // This is the filter we use to determine what the VAutocomplete
      // method is showing. We transform all queries to lowercase
      // for comparison for a better UX
      return (
        item['id'].toLowerCase().includes(queryText.toLowerCase()) ||
        item['name'].toLowerCase().includes(queryText.toLowerCase())
      )
    }
  },
  apollo: {
    taskRuns: {
      query: require('@/graphql/FlowRun/gantt-chart-task-runs.gql'),
      variables() {
        return {
          flowRunId: this.flowRunId
        }
      },
      skip() {
        return !this.flowId || !this.tasks
      },
      update: data => data.task_run
    },
    tasks: {
      query: require('@/graphql/FlowRun/gantt-chart-tasks.gql'),
      variables() {
        return {
          flowId: this.flowId
        }
      },
      skip() {
        return !this.flowRunId
      },
      update: data => data.task
    },
    mappedChildren: {
      query() {
        return gql`
        query MappedChildren {
          ${this.mappedChildrenQuery}
        }
      `
      },
      skip() {
        return !this.taskRuns || !this.mappedTaskRuns.length
      },
      update(data) {
        // Since mapped_children doesn't return an id (and we can't do this mapping with GraphQL)
        // we map those here instead
        const mappedTaskMap = {}
        Object.keys(data).forEach(
          (key, index) =>
            (mappedTaskMap[this.mappedTaskRuns[index]?.id] = {
              ...data[key],
              parent_id: this.mappedTaskRuns[index]?.id,
              task_id: this.mappedTaskRuns[index]?.task_id
            })
        )
        return mappedTaskMap
      }
    }
  }
}
</script>

<template>
  <v-card class="pa-2 mt-2 mb-16" tile>
    <v-system-bar :color="flowRun.state" :height="5" absolute />

    <CardTitle title="Gantt Chart" icon="pi-gantt">
      <div v-if="flowRun" slot="badge" class="body-2">
        <span>
          Run State:
          <span
            class="font-weight-bold"
            :style="{ color: `var(--v-${flowRun.state}-base)` }"
          >
            {{ flowRun.state }}
          </span>
        </span>

        <span class="ml-4">
          Duration:
          <span v-if="flowRun.start_time" class="font-weight-black">
            <DurationSpan
              :start-time="flowRun.start_time"
              :end-time="flowRun.end_time"
            />
          </span>
        </span>
      </div>
    </CardTitle>

    <v-card-text class="">
      {{ mappedChildren }}
      <!-- <div v-for="item in items" :key="item.id">
        {{ item.name }}
      </div> -->
      <!--       
      <div class="search-container">
        <v-autocomplete
          v-model="selectedTaskIds"
          autocomplete="new-password"
          class="mx-0 my-4"
          light
          background-color="white"
          single-line
          multiple
          solo
          flat
          dense
          clearable
          :items="tasks"
          :search-input.sync="search"
          :filter="searchFilter"
          prepend-inner-icon="search"
          label="Select tasks to compare"
          item-text="name"
          debounce="150"
          item-value="id"
          disable-lookup
        >
          <template v-if="search == null" v-slot:no-data>
            <v-list-item>
              <v-list-item-title>
                Type to search for a <strong>Task</strong> by
                <strong>name</strong> or <strong>id</strong>
              </v-list-item-title>
            </v-list-item>
          </template>
          <template v-else v-slot:no-data>
            <v-list-item>
              <v-list-item-title>
                No results matched your search.
              </v-list-item-title>
            </v-list-item>
          </template>
          <template v-slot:prepend-item>
            <div>
              <v-list-item
                :input-value="selectedTaskIds === 0"
                @click="
                  selectedTaskIds = []
                  searchInput = null
                "
              >
                <v-list-item-content>
                  <v-list-item-title class="text-body-1">
                    All Tasks
                  </v-list-item-title>
                  <v-list-item-subtitle class="text-body-2 font-weight-regular">
                    Reset the chart
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-divider class="my-2" />
            </div>
          </template>

          <template v-slot:selection="data">
            <v-chip
              v-bind="data.attrs"
              :input-value="data.selected"
              close
              width="100"
              class="my-1 truncate"
              @click="data.select"
              @click:close="removeSelectedTask(data.item)"
            >
              {{ data.item.name }}
            </v-chip>
          </template>

          <template v-slot:item="data">
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
      </div> -->
    </v-card-text>
    <!-- 
    <GanttChart
      v-if="tasks"
      :items="items"
      :live="flowRun.state === 'Running'"
      chart-height="500px"
      :start-time="startTime"
      :end-time="endTime"
      y-field="id"
      :click-disabled="!!showMapped"
      @bar-click="_handleClick"
    /> -->
  </v-card>
</template>

<style lang="scss" scoped>
.search-container {
  align-self: flex-end;
  max-width: 500px;
  width: 100%;
}
</style>
