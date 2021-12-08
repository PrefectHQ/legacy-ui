<script>
import BarChart from '@/components/Visualizations/BarChart.vue'
import { flowRunHistoryMixin } from '@/mixins/flowRunHistoryMixin'
import TimelineTooltip from '@/components/TimelineTooltip'
import { roundedOneAgo } from '@/utils/dateTime'

export default {
  components: {
    BarChart,
    TimelineTooltip
  },
  mixins: [flowRunHistoryMixin],
  props: {
    projectId: {
      type: String,
      default: () => null
    },
    visible: { type: Boolean, default: () => true }
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
  apollo: {
    flowRuns: {
      query: require('@/graphql/Dashboard/timeline-flow-runs.gql'),
      variables() {
        return {
          limit: this.scheduledFlowRuns?.length === 0 ? 100 : 90,
          project_id: this.projectId == '' ? null : this.projectId,
          date: roundedOneAgo('month')
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
  <v-card class="px-3 pt-7 pb-0" style="height: 100%;" tile>
    <div class="text-caption text-left grey--text timeline-title">
      <v-icon x-small>pi-flow-run</v-icon><span class="ml-1">Run History</span>
    </div>

    <div
      v-if="!loading && reversedRuns.length === 0"
      class="text-caption text-center grey--text timeline-no-runs"
    >
      No run history in the last month
    </div>
    <BarChart
      :loading="loading"
      :items="reversedRuns"
      :breaklines="breaklines"
      :height="150"
      :min-bands="100"
      show-controls
      :visible="visible"
      y-field="duration"
      @bar-click="_barClick"
      @bar-mouseout="_barMouseout"
      @bar-mouseover="_barMouseover"
    >
      <template v-if="canShowTooltip" slot="tooltip">
        <TimelineTooltip
          :tooltip="tooltip"
          :loading="tooltipLoading"
          :show-project-name="$route.name === 'dashboard'"
        />
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
