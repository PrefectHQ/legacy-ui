<script>
import BarChart from '@/components/Visualizations/BarChart.vue'
import { formatTime } from '@/mixins/formatTimeMixin'
import moment from 'moment'
import TimelineTooltip from '@/components/TimelineTooltip'

export default {
  components: {
    BarChart,
    TimelineTooltip
  },
  mixins: [formatTime],
  props: {
    archived: {
      required: false,
      type: Boolean,
      default: () => false
    },
    flowId: {
      required: false,
      type: String,
      default: null
    },
    agentId: {
      required: false,
      type: String,
      default: null
    },
    disableView: {
      required: false,
      type: Boolean,
      default: false
    },
    runs: {
      required: false,
      type: Array,
      default: null
    }
  },
  data() {
    return {
      loadingKey: 0,
      tooltip: null
    }
  },
  computed: {
    pollInterval() {
      return this.archived ? 0 : 60000
    },
    preppedFlowRuns() {
      if (!this.flowRuns && !this.runs) return []

      const computedStyle = getComputedStyle(document.documentElement)
      const runs = this.runs || this.flowRuns
      const prepped = runs
        .filter(
          run => run.flow_id == this.flowId || run.agent_id === this.agentId
        )

        .reverse()
        .map(d => {
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
          d.opacity = 1
          d.warningOpacity = 0
          return d
        })
      return prepped
    }
  },
  mounted() {
    if (this.pollInterval > 0) {
      this.$apollo.queries.flowRuns.startPolling(this.pollInterval)
    }
  },
  methods: {
    _barMouseout() {
      this.tooltip = null
    },
    async _barMouseover(d) {
      if (this.runs) {
        try {
          const { data } = await this.$apollo.query({
            query: require('@/graphql/Dashboard/timeline-flow.gql'),
            variables: {
              flowId: d.data?.flow_id
            }
          })

          d.data.flow = data.flow_by_pk
        } catch (e) {
          throw new Error(e)
        }
      }
      if (d.data.end_time) {
        d.data.display_end_time = this.formatTime(d.data.end_time)
      }

      if (d.data.start_time) {
        d.data.display_start_time = this.formatTime(d.data.start_time)
      }

      if (d.data.scheduled_start_time) {
        d.data.display_scheduled_start_time = this.formatTime(
          d.data.scheduled_start_time
        )
      }
      d.limited_view = !!this.runs
      d.status_style = this.statusStyle(d.data.state)

      this.tooltip = d
    },
    _barClick(d) {
      this.$router.push({
        name: 'flow-run',
        params: {
          id: d.id
        }
      })
    },
    formatTime(timestamp) {
      if (!timestamp) throw new Error('Did not recieve a timestamp')

      let t = moment(timestamp).tz(this.timezone),
        shortenedTz = moment()
          .tz(this.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
          .zoneAbbr()

      let timeObj = t ? t : moment(timestamp)

      let formatted = timeObj.calendar(null, {
        sameDay: 'h:mma',
        sameElse: 'MMMM D, YYYY [at] h:mma'
      })
      return `${formatted} ${shortenedTz}`
    },
    statusStyle(state) {
      return {
        'border-radius': '50%',
        display: 'inline-block',
        'background-color': `var(--v-${state}-base)`,
        height: '1rem',
        width: '1rem'
      }
    },
    onIntersect([entry]) {
      this.$apollo.queries.flowRuns.skip = !entry.isIntersecting
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Dashboard/last-flow-runs.gql'),
      variables() {
        return {
          flowId: this.flowId || null
        }
      },
      skip() {
        return !!this.runs
      },
      loadingKey: 'loadingKey',
      update: data => data?.flow_run
    }
  }
}
</script>

<template>
  <div>
    <BarChart
      v-intersect.once="onIntersect"
      :items="preppedFlowRuns"
      :loading="loadingKey > 0"
      :height="50"
      :min-bands="10"
      normalize
      :padding="0"
      y-field="duration"
      @bar-click="_barClick"
      @bar-mouseout="_barMouseout"
      @bar-mouseover="_barMouseover"
    />

    <div v-if="tooltip" class="barchart-tooltip v-tooltip__content text-left">
      <TimelineTooltip :tooltip="tooltip" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.barchart-tooltip {
  left: 50%;
  pointer-events: none;
  position: absolute;
  text-overflow: initial;
  transform: translate(-50%);
  user-select: none;
  width: fit-content !important;
  z-index: 10;
}
</style>
