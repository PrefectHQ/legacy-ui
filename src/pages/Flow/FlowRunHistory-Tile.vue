<script>
import BarChart from '@/components/Visualizations/BarChart.vue'
import { flowRunHistoryMixin } from '@/mixins/flowRunHistoryMixin'
import TimelineTooltip from '@/components/TimelineTooltip'

export default {
  components: {
    BarChart,
    TimelineTooltip
  },
  mixins: [flowRunHistoryMixin],
  props: {
    aggregate: {
      type: Boolean,
      default: () => false
    },
    flow: {
      required: true,
      type: Object
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
    },
    pollInterval() {
      return this.flow.archived ? 0 : 5000
    }
  },
  watch: {
    watch: {
      flow() {
        this.$apollo.queries.flowRuns.stopPolling()

        if (this.pollInterval > 0) {
          this.$apollo.queries.flowRuns.startPolling(this.pollInterval)
        } else {
          this.$apollo.queries.flowRuns.refetch()
        }
      }
    }
  },
  mounted() {
    if (this.pollInterval > 0) {
      this.$apollo.queries.flowRuns.startPolling(this.pollInterval)
    }
  },
  methods: {},
  apollo: {
    flowRuns: {
      query: require('@/graphql/Flow/timeline-flow-runs.gql'),
      variables() {
        let variables = { heartbeat: null }

        if (this.aggregate) {
          variables.flow_group_id = this.flow.flow_group_id
        } else {
          variables.flow_id = this.flow.id
        }

        return variables
      },
      loadingKey: 'loadingKey',
      update: data => data.flow_run || []
    }
  }
}
</script>

<template>
  <v-card
    class="pa-0 pt-7 mb-4 appBackground"
    style="max-height: 114px;"
    tile
    flat
  >
    <div class="text-caption text-left grey--text timeline-title">
      <v-icon x-small>pi-flow-run</v-icon><span class="ml-1">Run History</span>
    </div>

    <div
      v-if="!loading && reversedRuns.length === 0"
      class="text-caption text-center grey--text timeline-no-runs"
    >
      No run history
    </div>
    <BarChart
      :loading="loading"
      :items="reversedRuns"
      :breaklines="breaklines"
      :height="100"
      :min-bands="100"
      show-controls
      :visible="visible"
      y-field="duration"
      @bar-click="_barClick"
      @bar-mouseout="_barMouseout"
      @bar-mouseover="_barMouseover"
    >
      <TimelineTooltip v-if="tooltip" slot="tooltip" :tooltip="tooltip" />
    </BarChart>
  </v-card>
</template>

<style lang="scss" scoped>
.timeline-title {
  left: 0;
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
