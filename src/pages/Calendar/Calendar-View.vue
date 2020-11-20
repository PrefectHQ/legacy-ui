<script>
import CalendarDay from '@/pages/Calendar/Calendar-Day'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    CalendarDay
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
      timePeriod: 'day',
      timePeriodOptions: ['day', 'week', 'month'],
      timeIntervalOptions: [1, 5, 15, 30, 60],
      timeInterval: 5,
      calendarInterval: 15,
      date: this.formatCalendarDate(new Date()),
      skip: true,
      flowId: '50caf36e-4315-4730-a78a-c6cefceaf4d1'
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    intervalCount() {
      return (60 / this.calendarInterval) * 24
    },
    flowIds() {
      const ids = this.flowRuns?.map(flowRun => flowRun.flow_id)
      return ids
    },
    print() {
      console.log(this.flowIds, this.flowId)
      return true
    }
  },
  methods: {},

  apollo: {
    flowId: {
      query: require('@/graphql/Calendar/distinct-on-calendar-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.date,
          endTime: this.end,
          distintOn: true
        }
      },
      skip() {
        return this.skip
      },
      fetchPolicy: 'cache-first',
      loadingKey: 'loadingKey',
      update: data => {
        return data.flow_run[6].flow_id
      }
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
  <v-container>
    <v-row>
      <v-col cols="3">
        <v-card v-if="print">
          <v-date-picker
            v-model="date"
            no-title
            color="primary"
            width="95%"
          ></v-date-picker>
        </v-card>
      </v-col>
      <v-col cols="12">
        <CalendarDay
          v-if="timePeriod === 'day'"
          :project-id="projectId"
          :date="date"
          :flow-id="flowId"
          :time-period="timePeriod"
          :time-interval="timeInterval"
          :calendar-interval="calendarInterval"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
