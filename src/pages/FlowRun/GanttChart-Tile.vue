<script>
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import GanttChart from '@/components/Visualizations/GanttChart'
import moment from 'moment'

export default {
  components: {
    CardTitle,
    DurationSpan,
    GanttChart
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
      selectedTaskId: null
    }
  },
  computed: {
    items() {
      if (!this.tasks) return []
      if (this.selectedTaskId) return this.taskMap[this.selectedTaskId]?.items
      return Object.keys(this.taskMap).map(id => this.taskMap[id])
    }
  },
  watch: {},
  methods: {},
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
      pollInterval: 1000,
      update(data) {
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
  <v-card class="pa-2 mt-2" tile>
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

    <GanttChart
      v-if="tasks"
      :items="items"
      :groups="tasks"
      :live="flowRun.state === 'Running'"
      :start-time="flowRun.start_time"
      :end-time="flowRun.end_time"
      y-field="id"
    />
  </v-card>
</template>
