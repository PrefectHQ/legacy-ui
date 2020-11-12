<script>
import FlowName from '@/pages/Dashboard/Calendar/FlowName'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'
import moment from '@/utils/moment'

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
      skip: false
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
      const timestamp = moment(this.date).add(1, 'days')
      const date = this.formatCalendarDate(timestamp)
      return date
    },
    flowRunEvents() {
      if (this.timePeriod != 'month') {
        const flowRuns = this.flowRuns?.map(flowRun => {
          flowRun.start = this.formatCalendarTime(flowRun.start_time)
          flowRun.end = this.formatCalendarTime(flowRun.end_time)
          flowRun.category = flowRun.flow_id
          return flowRun
        })
        return flowRuns
      }
      const flows = this.flows.map(flow => {
        if (flow?.flow_runs[0]?.start_time) {
          flow.start = this.formatCalendarTime(flow?.flow_runs[0]?.start_time)
          // flow.end = this.formatCalendarDate(flow?.flow_runs[0]?.start_time)
          return flow
        }
      })
      return flows
    },
    flowIds() {
      const ids = this.flowRuns?.map(flowRun => flowRun.flow_id)
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
          endTime: this.end
        }
      },
      skip() {
        return this.skip
      },
      fetchPolicy: 'cache-first',
      loadingKey: 'loadingKey',
      update: data => data.flow_run
    },
    flows: {
      query: require('@/graphql/Calendar/calendar-flows.gql'),
      skip() {
        return this.skip
      },
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          id: this.flowIds,
          startTime: this.timeBack
        }
      },
      loadingKey: 'loading',
      update: data => data?.flow
    }
  }
}
</script>

<template>
  <v-calendar
    ref="calendar"
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
    <template #category="{ category }">
      <FlowName :id="category" />
    </template>
  </v-calendar>
</template>
