<script>
import GanttChart from '@/components/Visualizations/GanttChart'

export default {
  components: { GanttChart },
  props: {
    flowId: {
      type: String,
      required: true
    },
    flowRunId: {
      type: String,
      required: true
    }
  },
  computed: {
    items() {
      //
      return []
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
    {{ tasks }}
    {{ taskRuns }}

    <GanttChart :items="items" />
  </v-card>
</template>
