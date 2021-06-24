<script>
import FlowRunMenu from '@/pages/Calendar/RunMenu'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'
import ExternalLink from '@/components/ExternalLink'

export default {
  components: {
    FlowRunMenu,
    ExternalLink
  },
  filters: {},
  mixins: [formatTime],
  props: {
    calendarInterval: {
      required: true,
      type: Number
    },
    date: {
      required: true,
      type: String
    },
    flowId: {
      required: true,
      type: String
    },
    type: {
      required: true,
      type: String
    }
  },
  data() {
    return {
      skip: false,
      loadingKey: 0,
      flowRunEvents: [],
      selectedEvent: null,
      selectedOpen: false,
      selectedElement: null,
      upcoming: null,
      scheduleBanner: false,
      closeBanner: false,
      timeout: null
    }
  },
  computed: {
    ...mapGetters('api', ['connected']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    intervalCount() {
      return (60 / this.calendarInterval) * 24
    },
    intervalHeight() {
      return this.type === 'day'
        ? this.flowRunEvents.length < 100
          ? 100
          : this.flowRunEvents.length > 1500
          ? this.flowRunEvents.length / 2
          : this.flowRunEvents.length
        : 100
    },
    start() {
      let days = 1
      const start =
        this.tzOffset(this.date) < 0
          ? this.subtractDay(this.date, days)
          : this.date
      return start
    },
    end() {
      let days = 1
      switch (this.type) {
        case '4day':
          days = this.tzOffset(this.date) > 0 ? 5 : 4
          break
        case 'day':
          days = this.tzOffset(this.date) > 0 ? 2 : 1
          break
      }
      return this.addDay(this.date, days)
    }
  },
  watch: {
    async tenant() {
      this.selectedEvent = null
      this.flowRunEvents = []
      await this.flowRunEventsList()
    },
    async backend() {
      this.selectedEvent = null
      this.flowRunEvents = []
      await this.flowRunEventsList()
    },
    async date() {
      this.selectedEvent = null
      this.flowRunEvents = []
      await this.flowRunEventsList()
    },
    async flowId() {
      this.selectedEvent = null
      this.flowRunEvents = []
      await this.flowRunEventsList()
    }
  },
  async created() {
    await this.flowRunEventsList()
    this.scrollToElement()
  },
  methods: {
    async flowRunEventsList() {
      this.$emit('loading', true)
      const queryVariables = {
        startTime: this.start,
        endTime: this.end,
        flowId: this.flowId
      }
      Promise.all([
        this.$apollo.query({
          query: require('@/graphql/Calendar/calendar-day-scheduled-flow-runs.gql'),
          variables: queryVariables,
          loadingKey: 'loadingKey'
        }),
        this.$apollo.query({
          query: require('@/graphql/Calendar/calendar-day-flow-runs.gql'),
          variables: queryVariables,
          loadingKey: 'loadingKey'
        }),
        this.$apollo.query({
          query: require('@/graphql/Calendar/calendar-day-running-flow-runs.gql'),
          variables: queryVariables,
          loadingKey: 'loadingKey'
        }),
        this.$apollo.query({
          query: require('@/graphql/Calendar/calendar-day-ongoing-flow-runs.gql'),
          variables: {
            startTime: this.start,
            endTime: this.date,
            flowId: this.flowId
          },
          loadingKey: 'loadingKey'
        })
      ]).then(runs => {
        this.upcoming = runs[0]?.data?.flow_run?.length
        const allRuns = [
          ...(runs[0]?.data?.flow_run || []),
          ...(runs[1]?.data?.flow_run || []),
          ...(runs[2]?.data?.flow_run || []),
          ...(runs[3]?.data?.flow_run || [])
        ]
        const uniqueRuns = [...new Set(allRuns)]
        const updatedRuns = uniqueRuns.map(flowRun => {
          const diff = new Date(flowRun.end_time) - new Date(flowRun.start_time)
          const addedTime = this.addTime(flowRun.start_time, 3, 'm')

          flowRun.start = !flowRun.start_time
            ? this.formatCalendarTime(flowRun.scheduled_start_time)
            : this.formatCalendarTime(flowRun.start_time)

          flowRun.end =
            flowRun.start_time && !flowRun.end_time
              ? this.formatCalendarTime(new Date())
              : diff < 60000
              ? addedTime
              : flowRun.start_time < this.date &&
                flowRun.end_time?.split('T')[0] > this.date
              ? this.formatCalendarTime(new Date())
              : this.formatCalendarTime(flowRun.end_time)

          flowRun.timed =
            flowRun.start_time < this.date
              ? !flowRun.end_time
                ? false
                : flowRun.end_time.split('T')[0] > this.date
                ? false
                : true
              : true

          flowRun.category = flowRun.flow_id
          return flowRun
        })
        this.flowRunEvents = updatedRuns
        this.$emit('loading', false)
        this.showScheduleBanner()
      })
    },
    showScheduleBanner() {
      this.scheduleBanner =
        this.flow?.is_schedule_active && this.upcoming > 8 && !this.closeBanner
          ? true
          : !this.closeBanner
          ? new Date(this.date) > new Date()
          : false
    },
    eventColor(event) {
      return event.state ? event.state : 'primary'
    },
    striped(event) {
      return event.state === 'Scheduled'
        ? 'striped'
        : event.state === 'Submitted'
        ? 'darker'
        : ''
    },
    handleEventClick(item, event) {
      clearTimeout(this.timeout)
      const open = () => {
        this.selectedEvent = item
        this.selectedElement = event.target
        this.selectedOpen = true
      }
      if (this.selectedOpen) {
        this.selectedOpen = false
        this.timeout = setTimeout(open, 10)
      } else {
        open()
      }
    },
    handleScheduleBanner() {
      this.scheduleBanner = false
      this.closeBanner = true
    },
    timeNow(time) {
      return time.split(':')[0] == this.getHour(new Date()) - 2
        ? 'scroll-here'
        : null
    },
    scrollToElement() {
      const el = this.$el.getElementsByClassName('scroll-here')[0]
      if (el) {
        el.scrollIntoView()
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
      loadingKey: 'loadingKey',
      update: data => data.flow_by_pk
    }
  }
}
</script>

<template>
  <v-sheet v-if="connected" height="100vh" class="sheet-tweaks">
    <v-snackbar
      v-model="scheduleBanner"
      top
      app
      :icon="$vuetify.breakpoint.lgAndUp ? 'announcement' : null"
      custom-class="pt-8"
      color="amber"
      transition="slide-y-transition"
    >
      <span :style="{ color: 'utilGrayDark' }">
        Reminder!
        <ExternalLink
          href="https://docs.prefect.io/orchestration/concepts/services.html#scheduler"
        >
          The Prefect Scheduler
        </ExternalLink>
        will only schedule 10 runs in advance.</span
      >
      <template #action="{ attrs }">
        <v-btn v-bind="attrs" text color="white" @click="handleScheduleBanner"
          >Close</v-btn
        >
      </template>
    </v-snackbar>
    <v-calendar
      ref="calendar"
      :now="date"
      :value="date"
      event-overlap-mode="stack"
      :events="flowRunEvents"
      :event-color="eventColor"
      :interval-height="intervalHeight"
      :interval-minutes="calendarInterval"
      :interval-count="intervalCount"
      :type="type"
      class="calendar-tweaks"
    >
      <template #event="{event}">
        <div
          :id="event.name"
          class="text-caption pl-2 event"
          :class="striped(event)"
          @click.self="handleEventClick(event, $event)"
        >
          {{ event.name }} {{ calEventTime(event.start_time, date) }}
          -
          {{ calEventTime(event.end_time, date) }}
        </div>
      </template>
      <template #interval="{time}">
        <div :class="timeNow(time)" />
      </template>
    </v-calendar>

    <v-menu
      :value="selectedOpen"
      content-class="menu-tweaks"
      :attach="selectedElement"
      offset-x
      max-width="50vW"
      :close-on-content-click="false"
    >
      <FlowRunMenu
        v-if="selectedEvent"
        :run="selectedEvent"
        :active="flow.is_schedule_active"
        type="flow-run"
      />
    </v-menu>
  </v-sheet>
</template>

<style lang="scss">
.event {
  height: 100%;
}

.darker {
  color: var(--v-utilGrayDark-base);
}

.limit-width {
  max-width: 20%;
}

/* stylelint-disable */

.sheet-tweaks {
  .theme--light {
    background-color: var(--v-appBackground-base) !important;
  }
}
.skeleton-tweak {
  .theme--light {
    background-color: var(--v-appBackground-base) !important;
  }
}
.calendar-tweaks {
  overflow: auto;

  .theme--light {
    background-color: var(--v-appBackground-base) !important;
  }
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

  .v-calendar-daily__intervals-head {
    max-width: 45px !important;
  }

  .striped {
    background: repeating-linear-gradient(
      135deg,
      var(--v-ScheduledAlt-base),
      var(--v-ScheduledAlt-base) 5px,
      var(--v-Scheduled-base) 5px,
      var(--v-Scheduled-base) 10px
    );
    color: #333; //true for light and dark
  }
}

//Make the popover menu visible

.menu-tweaks {
  cursor: default;
  // pointer-events: none !important;
}
.v-calendar .v-event {
  overflow: visible;
  z-index: auto;
}

.v-calendar .v-event-timed {
  overflow: visible;
  z-index: auto;
}
</style>
