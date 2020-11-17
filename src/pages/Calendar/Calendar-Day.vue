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
      // flowId: null,
      limit: {},
      startTime: {},
      multipleFlowRuns: { name: 'flow runs' }
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
      // return this.flowRuns.map(flowRun => {
      //   flowRun.start = this.formatCalendarTime(flowRun.start_time)
      //   flowRun.category = flowRun.flow_id
      //   flowRun.end = this.formatCalendarTime(flowRun.end_time)
      //   return flowRun
      // })
      const filtered = []
      this.flowRuns?.forEach((flowRun, index) => {
        const id = flowRun.flow_id
        if (!this.limit[id]) {
          this.limit[id] = this.addTime(flowRun.start_time, 15, 'minutes')
          this.startTime = {}
          this.startTime[id] = flowRun.start_time
        }
        if (this.limit[id] < flowRun.start_time) {
          const addFlowRun = this.multipleFlowRuns[id]
          if (addFlowRun.start) filtered.push(addFlowRun)
          this.limit[id] = null
          this.multipleFlowRuns[id] = { name: 'flow runs' }
          flowRun.start = this.formatCalendarTime(flowRun.start_time)
          flowRun.category = flowRun.flow_id
          flowRun.end = this.formatCalendarTime(flowRun.end_time)
          filtered.push(flowRun)
        }
        if (this.limit[id] >= flowRun.start_time) {
          if (!this.multipleFlowRuns[id])
            this.multipleFlowRuns[id] = { name: 'flow-runs' }
          this.multipleFlowRuns[id][index] = flowRun
          this.multipleFlowRuns[id].id = id
          this.multipleFlowRuns[id].state = 'Success'
          this.multipleFlowRuns[id].start = this.formatCalendarTime(
            this.startTime[id]
          )
          this.multipleFlowRuns[id].end = this.formatCalendarTime(
            flowRun.end_time
          )
          this.multipleFlowRuns[id].category = id
          const count = Object.keys(this.multipleFlowRuns[id]).length - 6
          this.multipleFlowRuns[id].name = `${count} flow runs`
        }
      })
      this.scheduledFlowRuns?.forEach(flowRun => {
        flowRun.start = this.formatCalendarTime(flowRun.scheduled_start_time)
        flowRun.category = flowRun.flow_id
        filtered.push(flowRun)
      })
      return filtered
    },
    flowIds() {
      console.log(this.flowRunEvents)
      const ids = this.flowRuns?.map(flowRun => flowRun.flow_id)
      return ids
    }
  },
  methods: {
    eventColor(event) {
      return event.state ? event.state : 'primary'
    },
    handleEventClick(event) {
      console.log(event.event)
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Calendar/calendar-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.date,
          endTime: this.end
          // flow_id: this.flowId
        }
      },
      skip() {
        return this.skip
      },
      fetchPolicy: 'cache-first',
      loadingKey: 'loadingKey',
      update: data => data.flow_run
    },
    scheduledFlowRuns: {
      query: require('@/graphql/Calendar/calendar-scheduled-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.date,
          endTime: this.end
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
      event-more
      event-overlap-threshold="0"
      :events="flowRunEvents"
      :event-color="eventColor"
      :interval-minutes="timeInterval"
      :interval-count="intervalCount"
      type="category"
      @click:event="handleEventClick"
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
