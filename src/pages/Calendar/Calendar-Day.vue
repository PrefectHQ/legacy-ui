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
      skip: false,
      loadingKey: 0,
      gettingRuns: false,
      flowRunEvents: [],
      selectedEvent: null,
      selectedOpen: false,
      selectedElement: null
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
      return this.addDay(this.date, 1)
    },
    overlay() {
      return this.loadingKey > 0 || this.gettingRuns
    }
  },
  watch: {
    async date() {
      this.gettingRuns = true
      this.flowRunEvents = await this.flowRunEventsList()
      this.gettingRuns = false
    },
    async flowId() {
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
          startTime: this.queryStart(this.date),
          endTime: this.end,
          flowIds: this.flowId
        },
        loadingKey: 'loadingKey'
      })
      const upcoming = await this.$apollo.query({
        query: require('@/graphql/Calendar/calendar-scheduled-flow-runs.gql'),
        variables: {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.date,
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
            const addedTime = this.addTime(flowRun.start, 3, 'm')
            flowRun.end = this.formatCalendarTime(addedTime)
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
    filteredFlowRunEvents(time) {
      const timeInParts = time.split(':')
      const runs = [...this.flowRuns, ...this.scheduledFlowRuns]
      const events = runs.filter(event => {
        const start = new Date(event.start_time).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })
        const startInParts = start.split(':')
        const starty = startInParts[0] >= timeInParts[0]
        const fin = startInParts[0] < timeInParts[0] + 1
        if (starty && fin) return event
      })
      return events
    },
    handleEventClick(event) {
      const open = () => {
        this.selectedEvent = event.event
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
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Calendar/calendar-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.convertCalendarStartTime(this.date),
          endTime: this.convertCalendarStartTime(this.end),
          flowIds: this.flowId
        }
      },
      skip() {
        return !this.flowId
      },
      fetchPolicy: 'cache-first',
      loadingKey: 'loadingKey',
      update: data => data.flow_run || []
    },
    scheduledFlowRuns: {
      query: require('@/graphql/Calendar/calendar-scheduled-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.convertCalendarStartTime(this.date),
          endTime: this.convertCalendarStartTime(this.end),
          flowIds: this.flowId
        }
      },
      skip() {
        return !this.flowId
      },
      fetchPolicy: 'cache-first',
      loadingKey: 'loadingKey',
      update: data => data.flow_run || []
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
      type="category"
      @click:event="handleEventClick"
    >
      <template #event="{event}">
        <div class="caption pl-2">
          {{ event.name }} {{ formTime(event.start_time) }} -
          {{ formTime(event.end_time) }}
        </div>
      </template>
      <template #category="{ category }">
        <FlowName :id="category" />
      </template>
    </v-calendar>
    <v-menu
      v-if="selectedEvent"
      v-model="selectedOpen"
      :close-on-content-click="false"
      :activator="selectedElement"
      offset-x
      bottom
      max-width="150px"
    >
      <v-card max-width="150px">
        <v-card-title>
          {{ selectedEvent.name }} - <FlowName :id="selectedEvent.flow_id"
        /></v-card-title>

        <v-card-text>
          <v-icon class="pr-4" :color="selectedEvent.state">pi-flow-run</v-icon>
          <router-link
            :to="{ name: 'flow-run', params: { id: selectedEvent.id } }"
          >
            {{ selectedEvent.name }}
          </router-link>
        </v-card-text>
      </v-card>
    </v-menu>
  </v-skeleton-loader>
</template>
