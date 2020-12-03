<script>
import FlowRunMenu from '@/components/RunMenu'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'
// import ExternalLink from '@/components/ExternalLink'

export default {
  components: {
    FlowRunMenu
    // ExternalLink
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
      selectedElement: null,
      type: 'day',
      upcoming: [],
      timeOptions: [
        { text: 'Four Days', value: '4day' },
        { text: 'Day', value: 'day' }
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
    scheduleBanner() {
      if (this.flow?.is_schedule_active && this.upcoming.length > 8) return true
      return new Date(this.date) > new Date()
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
      this.selectedEvent = null
      this.flowRunEvents = await this.flowRunEventsList()
    },
    async flowId() {
      this.selectedEvent = null
      this.flowRunEvents = await this.flowRunEventsList()
    },
    async type() {
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
      this.upcoming = upcoming.data.flow_run
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
    striped(event) {
      return event.state === 'Scheduled' ? 'striped' : null
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
  },
  apollo: {
    flow: {
      query: require('@/graphql/Calendar/calendar-flows.gql'),
      variables() {
        return {
          id: this.flowId
        }
      },
      skip() {
        return this.skip
      },
      fetchPolicy: 'cache-first',
      loadingKey: 'loadingKey',
      update: data => data.flow_by_pk
    }
  }
}
</script>

<template>
  <v-sheet height="64">
    <v-toolbar flat color="appBackground">
      <v-select
        v-model="type"
        label="Time Periods"
        :items="timeOptions"
        dense
        outlined
        class="pt-2 limit-width"
        hide-details
      ></v-select>
    </v-toolbar>
    <v-skeleton-loader
      type="list-item-three-line, list-item-three-line, list-item-three-line, list-item-three-line, list-item-three-line, list-item-three-line, list-item-three-line, list-item-three-line"
      :loading="loadingKey > 0 || gettingRuns"
      transition-group="quick-fade"
      tile
    >
      <v-sheet height="75vH">
        <v-calendar
          ref="calendar"
          :now="date"
          :value="date"
          color="primary"
          event-overlap-mode="stack"
          :events="flowRunEvents"
          :event-color="eventColor"
          :interval-height="200"
          :interval-minutes="calendarInterval"
          :interval-count="intervalCount"
          :type="type"
          class="calendar-tweaks"
          @click:event="handleEventClick"
        >
          <template #event="{event}">
            <div :id="event.name" class="caption pl-2" :class="striped(event)">
              {{ event.name }} {{ formTime(event.start_time) }} -
              {{ formTime(event.end_time) }}
            </div>
          </template>
        </v-calendar>
        <v-menu
          :value="selectedOpen"
          offset-y
          max-width="50vW"
          :close-on-content-click="false"
          :activator="selectedElement"
        >
          <FlowRunMenu
            v-if="selectedEvent"
            :run="selectedEvent"
            type="flow-run"
          />
        </v-menu>
      </v-sheet>
    </v-skeleton-loader>
  </v-sheet>
</template>

<style lang="scss">
.striped {
  background: repeating-linear-gradient(45deg, #ffeec4, #ffbe1e 10px);
  color: #3d2c00;
}

.limit-width {
  max-width: 20%;
}

/* stylelint-disable */
.calendar-tweaks {
  background-color: #f9f9f9;

  .v-calendar-daily__intervals-body {
    max-width: 45px !important;
  }
  .v-btn--fab.v-size--default {
    height: 35px;
    width: 30px;
  }
  .v-calendar-daily_head-weekday {
    padding: 3px 0px 0px 0px;
    font-size: 8px;
    text-align: center;
    text-transform: uppercase;
  }
}
</style>
