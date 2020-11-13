<script>
import FlowName from '@/pages/Calendar/FlowName'
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
      skip: false,
      loadingKey: 0
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
      return this.flowRuns?.map(flowRun => {
        flowRun.start = this.formatCalendarTime(flowRun.start_time)
        flowRun.end = this.formatCalendarTime(flowRun.end_time)
        flowRun.category = flowRun.flow_id
        return flowRun
      })
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
      <template #category="{ category }">
        <FlowName :id="category" class="minwidth" />
      </template>
    </v-calendar>
  </v-skeleton-loader>
</template>
