<script>
import FlowName from '@/pages/Calendar/FlowName'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'
// import moment from '@/utils/moment'

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
      flowId: null
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
      return this.addTime(this.date, 1, 'day')
    },
    flowRunEvents() {
      let lastFlowRun = {}
      let count = 1
      console.log(this.flowRuns)
      return this.flowRuns?.filter(flowRun => {
        flowRun.start = this.formatCalendarTime(flowRun.start_time)
        flowRun.end = this.formatCalendarTime(flowRun.end_time)
        flowRun.category = flowRun.flow_id
        const lastRunStart = this.addTime(lastFlowRun.start_time, 15, 'minutes')
        console.log(
          1,
          lastFlowRun.start_time,
          2,
          lastRunStart,
          3,
          flowRun.start
        )
        if (
          lastRunStart > flowRun.start &&
          lastFlowRun.flow_id === flowRun.flow_id
        ) {
          count++
          lastFlowRun.name = `${count} flow runs`
          return null
        }
        count = 1
        lastFlowRun = flowRun
        return flowRun
      })
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
