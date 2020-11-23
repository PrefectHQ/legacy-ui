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
      skip: true,
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
    flowIds() {
      const ids = this.flowRuns?.map(flowRun => flowRun.flow_id)
      return ids
    },
    overlay() {
      return this.loadingKey > 0 || this.gettingRuns
    }
  },
  watch: {
    async date() {
      this.gettingRuns = true
      this.flowRunEvents = await this.flowRunEventsMethod()
      this.gettingRuns = false
    },
    async flowId() {
      this.flowRunEvents = await this.flowRunEventsMethod()
    }
  },
  async created() {
    this.flowRunEvents = await this.flowRunEventsMethod()
  },
  methods: {
    async flowRunEventsMethod() {
      this.gettingRuns = true
      const timeGroups = this.timeGroups()
      let event = []
      timeGroups.forEach(async (timeGroup, i) => {
        const finished = await this.$apollo.query({
          query: require('@/graphql/Calendar/calendar-flow-runs.gql'),
          variables: {
            project_id: this.projectId == '' ? null : this.projectId,
            startTime: timeGroup,
            endTime: timeGroups[i + 1] || this.end,
            flowIds: this.flowId
          },
          loadingKey: 'loadingKey'
        })
        const upcoming = await this.$apollo.query({
          query: require('@/graphql/Calendar/calendar-scheduled-flow-runs.gql'),
          variables: {
            project_id: this.projectId == '' ? null : this.projectId,
            startTime: timeGroup,
            endTime: timeGroups[i + 1] || this.end,
            flowIds: this.flowId
          },
          loadingKey: 'loadingKey'
        })
        const allRuns = [...finished.data.flow_run, ...upcoming.data.flow_run]
        const flowRunsGroup = allRuns.reduce((runObj, flowRun) => {
          if (!runObj[flowRun.flow_id]) runObj[flowRun.flow_id] = []
          runObj[flowRun.flow_id].push(flowRun)
          return runObj
        }, {})

        for (const key in flowRunsGroup) {
          if (i === 0) {
            timeGroup = this.addTime(timeGroup, 1, 'm')
          }
          const flowRuns = {
            start: this.formatCalendarTime(timeGroup),
            category: key,
            runs: flowRunsGroup[key]
          }
          const name =
            flowRuns.runs.length > 1
              ? `${flowRuns.runs.length} flow runs`
              : flowRuns.runs[0].name
          flowRuns.name = name
          // flowRuns.start = this.formatCalendarTime(timeGroup)
          flowRuns.start =
            flowRuns.runs.length > 1 || !flowRuns.runs[0].start_time
              ? this.formatCalendarTime(timeGroup)
              : this.formatCalendarTime(flowRuns.runs[0].start_time)
          if (
            flowRuns.runs.length === 1 &&
            flowRuns.runs[0].start_time &&
            !flowRuns.runs[0].end_time
          )
            //Will need to fix this to handle timezones!!
            console.log(this.formatCalendarTime(new Date()))
          flowRuns.end = this.formatCalendarTime(new Date())
          if (flowRuns.runs.length === 1 && flowRuns.runs[0].end_time)
            flowRuns.end = this.formatCalendarTime(flowRuns.runs[0].end_time)
          const state = flowRuns.runs.filter(run => {
            return run.state !== 'Success'
          })
          flowRuns.state = state.length ? state[0].state : 'Success'
          event.push(flowRuns)
        }
      })
      this.gettingRuns = false
      return event
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
      nativeEvent.stopPropagation()
    }
  }
}
</script>

<template>
  <div>
    <v-calendar
      ref="calendar"
      class="calendarstyle"
      :now="date"
      :value="date"
      event-overlap-mode="column"
      :events="flowRunEvents"
      :event-color="eventColor"
      :interval-height="100"
      :interval-minutes="calendarInterval"
      :interval-count="intervalCount"
      type="category"
      @click:event="handleEventClick"
    >
      <template #event="{event}">
        <div class="caption pl-2">
          {{ event.name }} {{ formTime(event.start) }} -
          {{ formTime(event.end) }}
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
          {{ selectedEvent.name }} - <FlowName :id="selectedEvent.category"
        /></v-card-title>

        <v-card-text>
          <v-list two-line>
            <v-list-item
              v-for="(run, index) in selectedEvent.runs"
              :key="index"
            >
              <v-icon class="pr-4" :color="run.state">pi-flow-run</v-icon>
              <router-link :to="{ name: 'flow-run', params: { id: run.id } }">
                {{ run.name }}
              </router-link>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-btn text color="secondary" @click="selectedOpen = false">
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
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
