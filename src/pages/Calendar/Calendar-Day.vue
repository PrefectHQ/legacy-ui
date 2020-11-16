<script>
import FlowName from '@/pages/Calendar/FlowName'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    FlowName
  },
  filters: {},
  mixins: [formatTime],
  props: {
    projectId: {
      required: false,
      type: String,
      default: () => null
    },
    timeInterval: {
      required: true,
      type: Number
    },
    date: {
      required: true,
      type: String
    }
  },
  data() {
    return {
      skip: false,
      loadingKey: 0,
      flowId: null,
      filteredRuns: {}
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    intervalCount() {
      return (60 / this.timeInterval) * 24
    },
    end() {
      return this.addDay(this.date, 1)
    },
    flowRunEvents() {
      let lastRun = {}
      const filtered = this.flowRuns?.filter((flowRun, index) => {
        flowRun.start = this.formatCalendarTime(flowRun.start_time)
        flowRun.end = this.formatCalendarTime(flowRun.end_time)
        flowRun.category = flowRun.flow_id
        const previousRun = this.flowRuns[index - 1]
        const lastRunStart = this.addTime(previousRun?.start_time, 1, 'minutes')
        if (
          lastRunStart > flowRun.start_time &&
          previousRun.flow_id === flowRun.flow_id
        ) {
          if (!this.filteredRuns[flowRun.flow_id])
            this.filteredRuns[flowRun.flow_id] = []
          this.filteredRuns[flowRun.flow_id].push(flowRun)
          lastRun[index] = flowRun
          lastRun.name = 'Multiple Flows'
          return null
        }
        // console.log('big', flowRun, lastRunStart, flowRun.start)
        lastRun = flowRun
        return flowRun
      })
      console.log(this.filteredRuns)
      return filtered
    },
    flowIds() {
      console.log(this.flowRunEvents)
      const ids = this.uniqueFlowRuns?.map(flowRun => flowRun.flow_id)
      return ids
    }
  },
  methods: {
    eventColor(event) {
      return event.state
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Calendar/calendar-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.date,
          endTime: this.end,
          flow_id: this.flowId
        }
      },
      skip() {
        return this.skip
      },
      fetchPolicy: 'cache-first',
      loadingKey: 'loadingKey',
      update: data => data.flow_run
    }
  }
}
</script>

<template>
  <v-skeleton-loader
    :loading="loadingKey > 0"
    type="image"
    min-height="329"
    height="100%"
    transition="quick-fade"
    class="my-2"
    tile
  >
    <v-calendar
      ref="calendar"
      class="calendarstyle"
      :now="date"
      :value="date"
      :categories="flowIds"
      category-show-all
      event-overlap-mode="column"
      event-overlap-threshold="0"
      :events="flowRunEvents"
      :event-color="eventColor"
      :interval-minutes="timeInterval"
      :interval-count="intervalCount"
      type="category"
      @click:date="moreDays++"
    >
      <template #day-body class="minwidth"> </template>
      <template #category="{ category }">
        <FlowName :id="category" />
      </template>
    </v-calendar>
  </v-skeleton-loader>
</template>

<style lang="scss" scoped>
.calendarstyle {
  max-width: 95vw;
  overflow: scroll;
}

.minwidth {
  min-width: 500px;
  overflow: scroll;
}
</style>
