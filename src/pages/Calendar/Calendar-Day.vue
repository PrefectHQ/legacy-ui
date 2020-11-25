<script>
import FlowName from '@/pages/Calendar/FlowName'
import FlowRunMenu from '@/components/RunMenu'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    FlowName,
    FlowRunMenu
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
    calendarInterval: {
      required: true,
      type: Number
    },
    timePeriod: {
      required: false,
      type: String,
      default: 'hour'
    },
    date: {
      required: true,
      type: String
    },
    flowId: {
      required: true,
      type: String
    }
  },
  data() {
    return {
      skip: true,
      loadingKey: 0,
      gettingRuns: false,
      flowRunEvents: [],
      selectedEvent: null,
      selectedOpen: false,
      selectedElement: null,
      type: 'category',
      timeOptions: [
        { text: 'Four Days', value: '4day' },
        { text: 'Day', value: 'category' }
        // { text: 'Hour', value: 'hour' }
      ]
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    intervalCount() {
      return (60 / this.calendarInterval) * 24
    },
    end() {
      let days = 1
      switch (this.type) {
        case '4day':
          days = 4
          break
        case 'week':
          days = 7
          break
        case 'day':
          days = 1
          break
        case 'hour':
          return this.addTime(this.date, 1, 'h')
      }
      return this.addDay(this.date, days)
    }
  },
  watch: {
    async date() {
      this.gettingRuns = true
      this.selectedEvent = null
      this.flowRunEvents = await this.flowRunEventsList()
      this.gettingRuns = false
    },
    async flowId() {
      this.selectedEvent = null
      this.flowRunEvents = await this.flowRunEventsList()
    }
  },
  async created() {
    this.flowRunEvents = await this.flowRunEventsList()
  },
  methods: {
    async flowRunEventsList() {
      this.gettingRuns = true
      const finished = await this.$apollo.query({
        query: require('@/graphql/Calendar/calendar-flow-runs.gql'),
        variables: {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.convertCalendarStartTime(this.date),
          endTime: this.end,
          flowIds: this.flowId
        },
        loadingKey: 'loadingKey'
      })
      const upcoming = await this.$apollo.query({
        query: require('@/graphql/Calendar/calendar-scheduled-flow-runs.gql'),
        variables: {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.convertCalendarStartTime(this.date),
          endTime: this.end,
          flowIds: this.flowId
        },
        loadingKey: 'loadingKey'
      })
      const allRuns = [...finished.data.flow_run, ...upcoming.data.flow_run]

      allRuns.map(flowRun => {
        flowRun.start = !flowRun.start_time
          ? this.formatCalendarTime(flowRun.scheduled_start_time)
          : this.formatCalendarTime(flowRun.start_time)
        if (flowRun.start_time && !flowRun.end_time)
          //Will need to fix this to handle timezones!!?
          flowRun.end = this.formatCalendarTime(new Date())
        if (flowRun.end_time) {
          const diff = new Date(flowRun.end_time) - new Date(flowRun.start_time)
          if (diff < 60000) {
            const addedTime = this.addTimeNoTz(flowRun.start, 3, 'm')
            flowRun.end = addedTime
          } else {
            flowRun.end = this.formatCalendarTime(flowRun.end_time)
          }
        }
        flowRun.category = flowRun.flow_id
      })
      this.gettingRuns = false
      return allRuns
    },
    eventColor(event) {
      return event.state ? event.state : 'primary'
    },
    handleEventClick({ nativeEvent, event }) {
      const open = () => {
        this.selectedEvent = event
        this.selectedElement = nativeEvent.target
        setTimeout(() => {
          this.selectedOpen = true
        }, 10)
      }
      if (this.selectedOpen) {
        this.selectedOpen = false
        setTimeout(open, 10)
      } else {
        open()
      }
    }
  }
}
</script>

<template>
  <v-skeleton-loader
    type="image"
    :loading="loadingKey > 0 || gettingRuns"
    transition-group="quick-fade"
    tile
  >
    <v-select
      v-model="type"
      label="Time Periods"
      :items="timeOptions"
      outlined
    ></v-select>
    <v-calendar
      ref="calendar"
      :now="date"
      :value="date"
      event-overlap-mode="stack"
      :events="flowRunEvents"
      :event-color="eventColor"
      :interval-height="250"
      :interval-minutes="calendarInterval"
      :interval-count="intervalCount"
      :type="type"
      @click:event="handleEventClick"
    >
      <template #event="{event}">
        <div :id="event.name" class="caption pl-2">
          {{ event.name }} {{ formTime(event.start_time) }} -
          {{ formTime(event.end_time) }}
        </div>
      </template>
      <template #category="{ category }">
        <FlowName :id="category" />
      </template>
    </v-calendar>
    <v-menu
      :value="selectedOpen"
      absolute
      offset-x
      :close-on-content-click="false"
      :activator="selectedElement"
    >
      <FlowRunMenu :run="selectedEvent" type="flow-run" />
    </v-menu>
  </v-skeleton-loader>
</template>
