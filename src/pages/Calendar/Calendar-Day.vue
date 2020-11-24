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
    // async flowRunEventsMethod() {
    //   this.gettingRuns = true
    //   const timeGroups = this.timeGroups()
    //   let event = []
    //   timeGroups.forEach(async (timeGroup, i) => {
    //     const finished = await this.$apollo.query({
    //       query: require('@/graphql/Calendar/calendar-flow-runs.gql'),
    //       variables: {
    //         project_id: this.projectId == '' ? null : this.projectId,
    //         startTime: timeGroup,
    //         endTime: timeGroups[i + 1] || this.end,
    //         flowIds: this.flowId
    //       },
    //       loadingKey: 'loadingKey'
    //     })
    //     const upcoming = await this.$apollo.query({
    //       query: require('@/graphql/Calendar/calendar-scheduled-flow-runs.gql'),
    //       variables: {
    //         project_id: this.projectId == '' ? null : this.projectId,
    //         startTime: timeGroup,
    //         endTime: timeGroups[i + 1] || this.end,
    //         flowIds: this.flowId ? [this.flowId] : null
    //       },
    //       loadingKey: 'loadingKey'
    //     })
    //     const allRuns = [...finished.data.flow_run, ...upcoming.data.flow_run]
    //     const flowRunsGroup = allRuns.reduce((runObj, flowRun) => {
    //       if (!runObj[flowRun.flow_id]) runObj[flowRun.flow_id] = []
    //       runObj[flowRun.flow_id].push(flowRun)
    //       return runObj
    //     }, {})

    //     for (const key in flowRunsGroup) {
    //       if (i === 0) {
    //         timeGroup = this.addTime(timeGroup, 1, 'm')
    //       }
    //       const flowRuns = {
    //         start: this.formatCalendarTime(timeGroup),
    //         category: key,
    //         runs: flowRunsGroup[key]
    //       }
    //       const name =
    //         flowRuns.runs.length > 1
    //           ? `${flowRuns.runs.length} flow runs`
    //           : flowRuns.runs[0].name
    //       flowRuns.name = name
    //       // flowRuns.start = this.formatCalendarTime(timeGroup)
    //       flowRuns.start =
    //         flowRuns.runs.length > 1 || !flowRuns.runs[0].start_time
    //           ? this.formatCalendarTime(timeGroup)
    //           : this.formatCalendarTime(flowRuns.runs[0].start_time)
    //       if (
    //         flowRuns.runs.length === 1 &&
    //         flowRuns.runs[0].start_time &&
    //         !flowRuns.runs[0].end_time
    //       )
    //         //Will need to fix this to handle timezones!!?
    //         flowRuns.end = this.formatCalendarTime(new Date())
    //       if (flowRuns.runs.length === 1 && flowRuns.runs[0].end_time)
    //         flowRuns.end = this.formatCalendarTime(flowRuns.runs[0].end_time)
    //       const state = flowRuns.runs.filter(run => {
    //         return run.state !== 'Success'
    //       })
    //       flowRuns.state = state.length ? state[0].state : 'Success'
    //       event.push(flowRuns)
    //     }
    //   })
    //   this.gettingRuns = false
    //   return event
    // },
    async flowRunEventsList() {
      this.gettingRuns = true
      const finished = await this.$apollo.query({
        query: require('@/graphql/Calendar/calendar-flow-runs.gql'),
        variables: {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.date,
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
        if (flowRun.end_time)
          flowRun.end = this.formatCalendarTime(flowRun.end_time)
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
          startTime: this.date,
          endTime: this.end,
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
          startTime: this.date,
          endTime: this.end,
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
    min-height="329"
    height="100%"
    :loading="loadingKey > 0 || gettingRuns"
    transition-group="quick-fade"
    class="my-2"
    tile
  >
    <v-calendar
      ref="calendar"
      class="calendarstyle"
      :now="date"
      :value="date"
      event-overlap-mode="stack"
      :events="flowRunEvents"
      :event-color="eventColor"
      :interval-height="150"
      :interval-minutes="calendarInterval"
      :interval-count="intervalCount"
      type="category"
      @click:event="handleEventClick"
    >
      <template #event="{event}">
        <div class="caption pl-2">
          {{ event.name }} {{ formTimeNoTimeZone(event.start) }} -
          {{ formTimeNoTimeZone(event.end) }}
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
      max-width="150px"
    >
      <v-card max-width="150px">
        <v-card-title>
          {{ selectedEvent.name }} - <FlowName :id="selectedEvent.flow_id"
        /></v-card-title>

        <v-card-text>
          <v-icon class="pr-4" :color="selectedEvent.state">pi-flow-run</v-icon>
          <router-link
            :to="{ name: 'flow-run', params: { id: selectedEvent.flow_id } }"
          >
            {{ selectedEvent.name }}
          </router-link>
        </v-card-text>
      </v-card>
    </v-menu>
  </v-skeleton-loader>
</template>

<style lang="scss">
.calendarstyle {
  max-width: 100vw;
  overflow: scroll;

  // .v-event-timed {
  // max-width: 80px;
  // max-height: 5px;
  // }
}
</style>
