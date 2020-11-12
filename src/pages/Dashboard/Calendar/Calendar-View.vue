<script>
import CardTitle from '@/components/Card-Title'
import FlowName from '@/pages/Dashboard/Calendar/FlowName'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'
import { oneAgo } from '@/utils/dateTime.js'

export default {
  components: {
    CardTitle,
    FlowName
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
      flows: [],
      limit: 15,
      loading: 0,
      timePeriod: 'category',
      timeInterval: 15
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    today() {
      return this.formatCalendarTime(new Date())
    },
    intervalCount() {
      return (60 / this.timeInterval) * 24
    },
    flowRunEvents() {
      if (this.timePeriod != 'month') {
        const flowRuns = this.flowRuns?.map(flowRun => {
          flowRun.start = this.formatCalendarTime(flowRun.start_time)
          flowRun.end = this.formatCalendarTime(flowRun.end_time)
          flowRun.category = flowRun.flow_id
          return flowRun
        })
        console.log('fr', flowRuns)
        return flowRuns
      }
      const flows = this.flows.map(flow => {
        if (flow?.flow_runs[0]?.start_time) {
          flow.start = this.formatCalendarTime(flow?.flow_runs[0]?.start_time)
          // flow.end = this.formatCalendarDate(flow?.flow_runs[0]?.start_time)
          console.log('flow', flow)
          return flow
        }
      })
      return flows
    },
    flowIds() {
      const ids = this.flowRuns?.map(flowRun => flowRun.flow_id)
      console.log('flow ids', ids)
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
          startTime: oneAgo(
            this.timePeriod === 'category' ? 'day' : this.timePeriod
          )
        }
      },
      loadingKey: 'loadingKey',
      update: data => data.flow_run
    },
    flows: {
      query: require('@/graphql/Calendar/calendar-flows.gql'),
      skip() {
        return this.timePeriod != 'month'
      },
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          id: this.flowIds,
          startTime: oneAgo(
            this.timePeriod === 'category' ? 'day' : this.timePeriod
          )
        }
      },
      loadingKey: 'loading',
      update: data => data?.flow
    }
  }
}
</script>

<template>
  <v-card class="pa-2" tile>
    <CardTitle title="Calendar" icon="calendar">
      <div slot="action" class="flex align-center justify-end"> </div>
    </CardTitle>

    <v-sheet height="400" class="pa-0 pl-8">
      <v-calendar
        ref="calendar"
        :now="today"
        :value="today"
        :categories="flowIds"
        category-show-all
        event-overlap-mode="column"
        event-overlap-threshold="0"
        :events="flowRunEvents"
        :event-color="eventColor"
        :interval-minutes="timeInterval"
        :interval-count="intervalCount"
        :type="timePeriod"
      >
        <template #category="{ category }">
          <FlowName :id="category" />
        </template>
      </v-calendar>
    </v-sheet>
  </v-card>
</template>
