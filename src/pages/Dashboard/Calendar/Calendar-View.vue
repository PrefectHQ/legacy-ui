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
      timePeriod: 'day'
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    today() {
      return this.formatCalendarDate(new Date())
    },
    flowRunEvents() {
      const flowRuns = this.flowRuns?.map(flowRun => {
        flowRun.start = this.formatCalendarTime(flowRun.start_time)
        flowRun.end = this.formatCalendarTime(flowRun.end_time)
        flowRun.category = flowRun.flow_id
        return flowRun
      })
      return flowRuns
    }
  },
  watch: {
    search(val) {
      this.$router.replace({
        query: { ...this.$route.query, flows: val }
      })
    },
    showArchived(val) {
      let query = { ...this.$route.query }

      if (val) {
        query.archived = true
      } else {
        delete query.archived
      }
      this.$router.replace({
        query: query
      })
    }
  },
  methods: {
    eventColor(event) {
      return event.state
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Dashboard/calendar-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: oneAgo(this.timePeriod)
        }
      },
      pollInterval: 5000,
      loadingKey: 'loadingKey',
      update: data => data.flow_run
    },
    flows: {
      query() {
        return require('@/graphql/Dashboard/flows.js').default(this.isCloud)
      },
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: oneAgo(
            this.timePeriod === 'category' ? 'day' : this.timePeriod
          )
        }
      },
      loadingKey: 'loading',
      pollInterval: 60000,
      update: data => data?.flow.id
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
        :categories="flows"
        category-show-all
        event-overlap-mode="column"
        event-overlap-threshold="0"
        :events="flowRunEvents"
        :event-color="eventColor"
        :type="timePeriod"
      >
        <template #category="{ category }">
          <FlowName :id="category" />
        </template>
      </v-calendar>
    </v-sheet>
  </v-card>
</template>
