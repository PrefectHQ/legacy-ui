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
      timeInterval: 2,
      calendarInterval: 60,
      date: this.formatCalendarDate(new Date()),
      skip: false,
      selectedFlow: null,
      filters: [{ name: 'Flows' }],
      loadingKey: 0
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    flowId() {
      if (this.selectedFlow) return this.flowRuns[this.selectedFlow].flow_id
      if (this.flowRuns && this.flowRuns[0]) return this.flowRuns[0]?.flow_id
      return this.scheduledFlowRuns[0]?.flow_id
    },
    allRuns() {
      return [...this.flowRuns, ...this.scheduledFlowRuns]
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
        <!-- <v-time-picker v-model="start" :max="end"></v-time-picker>
        <v-time-picker v-model="end" :max="start"></v-time-picker> -->
        <v-skeleton-loader
          type="image"
          min-height="329"
          height="100%"
          :loading="loadingKey > 0"
          transition-group="quick-fade"
          class="my-2"
          tile
        >
          <v-expansion-panels :value="0">
            <v-expansion-panel v-for="(filter, index) in filters" :key="index">
              <v-expansion-panel-header>
                {{ filter.name }}
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-list>
                  <v-list-item-group v-model="selectedFlow" color="primary">
                    <v-list-item v-for="item in flowRuns" :key="item.id" dense>
                      <v-list-item-content>
                        <v-list-item-subtitle class="font-weight-light">
                          <FlowName :id="item.flow_id" />
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-skeleton-loader>
      </v-col>
      <v-col class="pa-0" cols="12" md="9" lg="10">
        <CalendarDay
          v-if="timePeriod === 'day' && flowId"
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
