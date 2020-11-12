<script>
import FlowName from '@/pages/Dashboard/Calendar/FlowName'
import { mapGetters } from 'vuex'
import moment from '@/utils/moment'
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
    }
  },
  data() {
    return {
      flows: [],
      limit: 15,
      loading: 0,
      timePeriod: 'category',
      timePeriodOptions: ['category', 'week', 'month'],
      timeIntervalOptions: [1, 5, 15, 30, 60],
      timeInterval: 15,
      moreDays: -8
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    date() {
      const today = moment()
      const timestamp = moment(today).add(this.moreDays, 'days')
      const date = this.formatCalendarDate(timestamp)
      console.log('time', date)
      return date
    },
    intervalCount() {
      return (60 / this.timeInterval) * 24
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
    // timeBack() {
    //   const numberOfUnits =
    //     return moment
    //       .utc()
    //       .subtract(numberOfUnits, unitOftime)
    //       .format()
    //  this.timePeriod === 'category' ? 'day' : this.timePeriod)
    // }
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
          startTime: this.date
        }
      },
      fetchPolicy: 'cache-first',
      loadingKey: 'loadingKey',
      update: data => data.flow_run
    },
    flows: {
      query: require('@/graphql/Calendar/calendar-flows.gql'),
      skip() {
        return this.timePeriod != 'month'
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
  <v-sheet height="400" class="pa-0 pl-8">
    <v-select v-model="timePeriod" :items="timePeriodOptions"></v-select>
    <v-select v-model="timeInterval" :items="timeIntervalOptions"></v-select>

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
      :type="timePeriod"
      @click:date="moreDays++"
    >
      <template #category="{ category }">
        <FlowName :id="category" />
      </template>
    </v-calendar>
  </v-sheet>
</template>
