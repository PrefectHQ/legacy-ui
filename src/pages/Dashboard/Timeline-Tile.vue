<script>
import BarChart from '@/components/Visualizations/BarChart.vue'
import { timelineMixin } from '@/mixins/timelineMixin'
import TimelineTooltip from '@/components/TimelineTooltip'

export default {
  components: {
    BarChart,
    TimelineTooltip
  },
  mixins: [timelineMixin],
  props: {
    projectId: {
      type: String,
      default: () => null
    }
  },
  data() {
    return {
      loadingKey: 0
    }
  },
  computed: {
    loading() {
      return this.loadingKey > 0
    }
  },
  watch: {
    flowRuns() {
      if (this.tooltip) {
        let exists = this.flowRuns.find(f => f.id == this.tooltip.data.id)
        this.tooltip = exists ? this.tooltip : null
      }
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Dashboard/timeline-flow-runs.gql'),
      variables() {
        return {
          limit: this.scheduledFlowRuns?.length === 0 ? 100 : 90,
          project_id: this.projectId == '' ? null : this.projectId
        }
      },
      pollInterval: 5000,
      loadingKey: 'loadingKey',
      update: data => data.flow_run || []
    },
    scheduledFlowRuns: {
      query: require('@/graphql/Dashboard/timeline-scheduled-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId
        }
      },
      pollInterval: 5000,
      loadingKey: 'loadingKey',
      update: data => data.flow_run || []
    }
  }
}
</script>

<template>
  <v-card class="px-3 pt-7 pb-0 my-4" style="max-height: 200px;" tile>
    <div class="caption text-left grey--text timeline-title">
      <v-icon x-small>pi-flow-run</v-icon><span class="ml-1">Run History</span>
    </div>

    <div
      v-if="!loading && reversedRuns.length === 0"
      class="caption text-center grey--text timeline-no-runs"
    >
      No run history
    </div>
    <BarChart
      :loading="loading"
      :items="reversedRuns"
      :breaklines="breaklines"
      :height="150"
      :min-bands="100"
      show-controls
      y-field="duration"
      @bar-click="_barClick"
      @bar-mouseout="_barMouseout"
      @bar-mouseover="_barMouseover"
    >
      <template v-if="canShowTooltip" slot="tooltip">
        <TimelineTooltip :tooltip="tooltip" />
      </template>
    </BarChart>
  </v-card>
</template>

<style lang="scss" scoped>
.timeline-title {
  left: 8px;
  position: absolute;
  top: 8px;
}

.timeline-no-runs {
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
