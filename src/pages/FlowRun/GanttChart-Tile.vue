<script>
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import GanttChart from '@/components/Visualizations/GanttChart'

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
  computed: {},
  apollo: {
    taskRuns: {
      query: require('@/graphql/FlowRun/gantt-chart-task-runs.gql'),
      variables() {
        return {
          flowRunId: this.flowRunId
        }
      },
      skip() {
        return !this.flowId
      },
      // pollInterval: 5000,
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
      // pollInterval: 5000,
      update: data => data.task
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
      :items="taskRuns"
      :groups="tasks"
      :start-time="flowRun.start_time"
      :end-time="flowRun.end_time"
    />
  </v-card>
</template>
