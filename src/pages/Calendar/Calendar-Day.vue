<script>
import FlowRunMenu from '@/components/RunMenu'
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
      gettingRuns: false,
      flowRunEvents: [],
      selectedEvent: null,
      selectedOpen: false,
      selectedElement: null,
      upcoming: [],
      intervalHeight: 100,
      scheduleBanner: false,
      closeBanner: false
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    intervalCount() {
      return (60 / this.calendarInterval) * 24
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
    async date() {
      this.selectedEvent = null
      this.flowRunEvents = await this.flowRunEventsList()
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
      const scheduledRuns = await this.$apollo.query({
        query: require('@/graphql/Calendar/calendar-day-scheduled-flow-runs.gql'),
        variables: {
          startTime: this.start,
          endTime: this.end,
          flowId: this.flowId
        },
        loadingKey: 'loadingKey'
      })
      const finishedRuns = await this.$apollo.query({
        query: require('@/graphql/Calendar/calendar-day-flow-runs.gql'),
        variables: {
          startTime: this.start,
          endTime: this.end,
          flowId: this.flowId
        },
        loadingKey: 'loadingKey'
      })
      const runningRuns = await this.$apollo.query({
        query: require('@/graphql/Calendar/calendar-day-running-flow-runs.gql'),
        variables: {
          startTime: this.start,
          endTime: this.end,
          flowId: this.flowId
        },
        loadingKey: 'loadingKey'
      })
      const ongoingRuns = await this.$apollo.query({
        query: require('@/graphql/Calendar/calendar-day-ongoing-flow-runs.gql'),
        variables: {
          startTime: this.start,
          endTime: this.date,
          flowId: this.flowId
        },
        loadingKey: 'loadingKey'
      })
      const allRuns = [
        ...(finishedRuns?.data?.flow_run ? finishedRuns.data.flow_run : []),
        ...(scheduledRuns?.data?.flow_run ? scheduledRuns.data.flow_run : []),
        ...(runningRuns?.data?.flow_run ? runningRuns.data.flow_run : []),
        ...(ongoingRuns?.data?.flow_run ? ongoingRuns.data.flow_run : [])
      ]
      const uniqueRuns = [...new Set(allRuns)]
      if (this.type === 'day')
        this.intervalHeight =
          allRuns.length > 100
            ? allRuns.length > 1500
              ? allRuns.length / 2
              : allRuns.length
            : 100
      uniqueRuns.map(flowRun => {
        flowRun.start = !flowRun.start_time
          ? this.formatCalendarTime(flowRun.scheduled_start_time)
          : this.formatCalendarTime(flowRun.start_time)
        if (flowRun.start_time && !flowRun.end_time) {
          flowRun.end = this.formatCalendarTime(new Date())
          if (flowRun.start_time < this.date) {
            flowRun.timed = false
          } else {
            flowRun.timed = true
          }
        }
        if (flowRun.end_time) {
          const diff = new Date(flowRun.end_time) - new Date(flowRun.start_time)
          if (diff < 60000) {
            const addedTime = this.addTime(flowRun.start_time, 3, 'm')
            flowRun.end = addedTime
            flowRun.timed = true
          } else {
            flowRun.end = this.formatCalendarTime(flowRun.end_time)
            flowRun.timed = true
          }
        }
        if (!flowRun.start_time) {
          flowRun.timed = true
        }
        if (
          flowRun.start_time < this.date &&
          flowRun.end_time?.split('T')[0] > this.date
        ) {
          flowRun.end = this.formatCalendarTime(new Date())
          flowRun.timed = false
        }
        flowRun.category = flowRun.flow_id
      })
      this.gettingRuns = false
      if (
        this.flow?.is_schedule_active &&
        this.upcoming.length > 8 &&
        !this.closeBanner
      ) {
        this.scheduleBanner = true
      } else if (!this.closeBanner) {
        this.scheduleBanner = new Date(this.date) > new Date()
      }
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
    },
    handleScheduleBanner() {
      this.scheduleBanner = false
      this.closeBanner = true
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
  <v-skeleton-loader
    type="list-item-three-line, list-item-three-line, list-item-three-line, list-item-three-line, list-item-three-line, list-item-three-line, list-item-three-line, list-item-three-line"
    :loading="loadingKey > 0 || gettingRuns"
    transition-group="quick-fade"
    tile
    class="skeleton-tweak"
  >
    <v-snackbar
      v-model="scheduleBanner"
      top
      app
      :icon="$vuetify.breakpoint.lgAndUp ? 'announcement' : null"
      custom-class="pt-8"
      color="amber"
      transition="slide-y-transition"
    >
      <span :style="{ color: '#3d2c00' }">
        Reminder!
        <ExternalLink
          href="https://docs.prefect.io/orchestration/concepts/services.html#scheduler"
        >
          Prefect Scheduler
        </ExternalLink>
        will only schedule 10 runs in advance.</span
      >
      <template #action="{ attrs }">
        <v-btn v-bind="attrs" text color="white" @click="handleScheduleBanner"
          >Close</v-btn
        >
      </template>
    </v-snackbar>
    <v-sheet :height="'95vH'" class="sheet-tweaks">
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
        @click:event="handleEventClick"
      >
        <template #event="{event}">
          <div :id="event.name" class="caption pl-2" :class="striped(event)">
            {{ event.name }} {{ calEventTime(event.start_time, date) }}
            -
            {{ calEventTime(event.end_time, date) }}
          </div>
        </template>
      </v-calendar>
      <v-menu
        :value="selectedOpen"
        offset-y
        position-relative
        max-width="50vW"
        :close-on-content-click="false"
        :activator="selectedElement"
      >
        <FlowRunMenu
          v-if="selectedEvent"
          :run="selectedEvent"
          :active="flow.is_schedule_active"
          type="flow-run"
        />
      </v-menu>
    </v-sheet>
  </v-skeleton-loader>
</template>

<style lang="scss">
.striped {
  background: repeating-linear-gradient(
    135deg,
    #ffeec4,
    #ffeec4 5px,
    #ffbe1e 5px,
    #ffbe1e 10px
  );
  color: #3d2c00;
}

.limit-width {
  max-width: 20%;
}

/* stylelint-disable */

.sheet-tweaks {
  .theme--light {
    background-color: #f9f9f9 !important;
  }
}
.skeleton-tweak {
  .theme--light {
    background-color: #f9f9f9 !important;
  }
}
.calendar-tweaks {
  overflow: auto;

  .theme--light {
    background-color: #f9f9f9 !important;
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
}
</style>
