<script>
import CalendarDay from '@/pages/Calendar/Calendar-Day'
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'
import FlowName from '@/pages/Calendar/FlowName'

export default {
  components: {
    CalendarDay,
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
      timePeriod: 'day',
      timePeriodOptions: ['day', 'week', 'month'],
      timeIntervalOptions: [1, 5, 15, 30, 60],
      timeInterval: 15,
      calendarInterval: 60,
      date: this.formatCalendarDate(new Date()),
      skip: false,
      selectedFlowId: null,
      filters: [{ name: 'Flows' }]
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    flowId() {
      if (this.selectedFlowId) return this.selectedFlowId
      if (this.flowRuns && this.flowRuns[0]) return this.flowRuns[0]?.flow_id
      return this.scheduledFlowRuns[0]?.flow_id
    }
  },
  methods: {
    chooseSelectedFlow(flowRun) {
      this.selectedFlowId = flowRun.flow_id
    }
  },

  apollo: {
    flowRuns: {
      query: require('@/graphql/Calendar/distinct-on-calendar-flow-runs.gql'),
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
      update: data => data.flow_run || []
    }
  }
}
</script>

<template>
  <v-container>
    <v-row>
      <v-col class="pa-0" cols="12" md="3" lg="2">
        <v-date-picker
          v-model="date"
          no-title
          color="primary"
          width="99%"
        ></v-date-picker>
        <v-expansion-panels :value="0">
          <v-expansion-panel v-for="(filter, index) in filters" :key="index">
            <v-expansion-panel-header>
              {{ filter.name }}
            </v-expansion-panel-header>
            <v-expansion-panel-content>
              <v-list>
                <v-list-item
                  v-for="item in flowRuns"
                  :key="item.id"
                  dense
                  @click="chooseSelectedFlow(item)"
                >
                  <v-list-item-content>
                    <v-list-item-subtitle class="font-weight-light">
                      <FlowName :id="item.flow_id" />
                    </v-list-item-subtitle>
                  </v-list-item-content>
                </v-list-item>
              </v-list>
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
      <v-col class="pa-0" cols="12" md="9" lg="10">
        <CalendarDay
          v-if="timePeriod === 'day'"
          :project-id="projectId"
          :date="date"
          :flow-id="flowId"
          :time-period="timePeriod"
          :time-interval="timeInterval"
          :calendar-interval="calendarInterval"
        />
      </v-col>
    </v-row>
  </v-container>
</template>
