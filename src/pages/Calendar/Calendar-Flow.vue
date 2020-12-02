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
    date: {
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
      return (60 / this.timeInterval) * 24
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
            endTime: timeGroups[i + 1] || this.end
          },
          loadingKey: 'loadingKey'
        })
        const upcoming = await this.$apollo.query({
          query: require('@/graphql/Calendar/calendar-scheduled-flow-runs.gql'),
          variables: {
            project_id: this.projectId == '' ? null : this.projectId,
            startTime: timeGroup,
            endTime: timeGroups[i + 1] || this.end
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
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Calendar/distinct-on-calendar-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.convertCalendarStartTime(this.date),
          endTime: this.end,
          distintOn: true
        }
      },
      skip() {
        return this.skip
      },
      fetchPolicy: 'cache-first',
      loadingKey: 'loadingKey',
      update: data => data.flow_run
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
  <div>
    <v-skeleton-loader
      :loading="loadingKey > 0 || gettingRuns"
      type="image"
      min-height="329"
      height="100%"
      transition="quick-fade"
      class="my-2"
      tile
    />

    <v-calendar
      ref="calendar"
      class="calendarstyle"
      :now="date"
      :value="date"
      :events="flowRunEvents"
      :event-color="eventColor"
      :interval-minutes="timeInterval"
      :interval-count="intervalCount"
      type="day"
      @click:event="handleEventClick"
    ></v-calendar>
    <v-menu
      v-if="selectedEvent"
      v-model="selectedOpen"
      :close-on-content-click="false"
      :activator="selectedElement"
      offset-x
    >
      <v-card max-width="150px">
        <v-card-title>
          {{ selectedEvent.name }} - <FlowName :id="selectedEvent.category"
        /></v-card-title>

        <v-card-text>
          <v-list>
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

<style lang="scss" scoped>
.calendarstyle {
  max-width: 95vw;
  overflow: scroll;
}

.minwidth {
  min-width: 500px;
  overflow: scroll;
}
</style>
