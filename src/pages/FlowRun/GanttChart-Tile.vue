<script>
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import GanttChart from '@/components/Visualizations/GanttChart'
import SearchResult from '@/components/Schematics/Preview-SearchResult'

import moment from 'moment'

export default {
  components: {
    CardTitle,
    DurationSpan,
    GanttChart,
    SearchResult
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
      selectedTaskId: null
    }
  },
  computed: {
    groups() {
      if (!this.tasks) return []
      if (this.selectedTaskId)
        return this.taskMap[this.selectedTaskId]?.items
          .filter(run => run.map_index !== -1)
          .sort((a, b) => a.map_index - b.map_index)
          .map(run => {
            return {
              id: run.id,
              name: run.map_index
            }
          })

      return this.tasks
    },
    items() {
      if (!this.tasks) return []
      if (this.selectedTaskId) return this.taskMap[this.selectedTaskId]?.items
      return Object.keys(this.taskMap).map(id => this.taskMap[id])
    },
    endTime() {
      if (this.selectedTaskId)
        return this.taskMap[this.selectedTaskId]?.end_time
      return this.flowRun.end_time
    },
    startTime() {
      if (this.selectedTaskId)
        return this.taskMap[this.selectedTaskId]?.start_time
      return this.flowRun.start_time
    },
    pollInterval() {
      return this.flowRun.state === 'Running' ? 1000 : 0
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
    }
  },

  methods: {
    _handleClick(data) {
      this.selectedTaskId = data?.id
    },
    _handleSearch(id) {
      this.selectedTaskId = id
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
      update(data) {
        Object.keys(this.taskMap).forEach(id => {
          this.taskMap[id].items = []
        })

        return data.task_run.map(task => {
          const ref = task.task_id

          if (
            !this.taskMap[ref].start_time ||
            (task.start_time &&
              moment(task.start_time).isBefore(this.taskMap[ref].start_time))
          ) {
            this.taskMap[ref].start_time = task.start_time
          }

          if (
            !this.taskMap[ref].end_time ||
            (task.start_time &&
              moment(task.end_time).isAfter(this.taskMap[ref].end_time))
          ) {
            this.taskMap[ref].end_time = task.end_time
          }

          task.color = this.computedStyle.getPropertyValue(
            `--v-${task.state}-base`
          )

          this.taskMap[ref].color = task.color
          this.taskMap[ref].state = task.state

          this.taskMap[ref].items.push(task)
          return task
        })
      }
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
      // pollInterval: 5000,
      update(data) {
        data.task.map(task => {
          if (task.id in this.taskMap) return
          this.taskMap[task.id] = {
            id: task.id,
            items: [],
            color: null,
            state: null,
            start_time: null,
            end_time: null
          }
        })

        return data.task
      }
    }
  }
}
</script>

<template>
  <v-card class="pa-2 mt-2" tile style="max-height: 80vh;">
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

      <template slot="action">
        <v-autocomplete
          v-model="searchInput"
          autocomplete="new-password"
          class="mx-0 py-0"
          auto-select-first
          light
          background-color="white"
          hide-details
          single-line
          flat
          solo
          dense
          clearable
          :items="tasks"
          :search-input.sync="search"
          :filter="searchFilter"
          placeholder="All Tasks"
          prepend-inner-icon="search"
          item-text="name"
          disable-lookup
          @change="_handleSearch"
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
                :input-value="!selectedTaskId"
                @click="
                  selectedTaskId = null
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
      </template>
    </CardTitle>

    <GanttChart
      v-if="tasks"
      :items="items"
      :groups="groups"
      :live="flowRun.state === 'Running'"
      chart-height="500px"
      :start-time="startTime"
      :end-time="endTime"
      y-field="id"
      :click-disabled="!!selectedTaskId"
      @bar-click="_handleClick"
    />
  </v-card>
</template>
