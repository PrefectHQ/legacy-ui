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
      calendarInterval: 60,
      date: this.formatCalendarDate(new Date()),
      skip: false,
      selectedFlow: 0,
      filters: [{ name: 'Flows' }],
      loadingKey: 0,
      refetching: false,
      type: 'day',
      typeToLabel: {
        month: 'Month',
        week: 'Week',
        day: 'Day',
        '4day': '4 Days'
      }
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    ...mapGetters('api', ['backend']),
    flowId() {
      if (this.selectedFlow) return this.selectedFlow
      if (this.allIds && this.allIds[0]) return this.allIds[0]
      return ''
    },
    allRuns() {
      if (this.flowRuns || this.scheduledFlowRuns || this.runningFlowRuns) {
        return new Date(this.date) < new Date()
          ? [
              ...this.flowRuns,
              ...this.scheduledFlowRuns,
              ...this.runningFlowRuns
            ]
          : [...this.flowRuns, ...this.scheduledFlowRuns]
      }
      return []
    },
    allIds() {
      const flowIds = this.allRuns?.map(flowRun => flowRun.flow_id)
      return flowIds ? [...new Set(flowIds)] : []
    },
    end() {
      return this.addDay(this.date, 1)
    },
    calTitle() {
      return this.getMonth(this.date)
    }
  },
  watch: {
    async tenant() {
      this.refetching = true
      await this.$apollo.queries.flowRuns.refetch()
      await this.$apollo.queries.scheduledFlowRuns.refetch()
      this.refetching = false
    },
    async backend() {
      this.refetching = true
      this.selectedFlow = null
      const runs = await this.$apollo.queries.flowRuns.refetch()
      const upcoming = await this.$apollo.queries.scheduledFlowRuns.refetch()
      if (runs.length || upcoming.length) this.refetching = false
    }
  },
  methods: {
    setToday() {
      this.date = this.formatCalendarDate(new Date())
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Calendar/distinct-on-calendar-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.convertCalendarStartTime(this.date),
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
          startTime: this.convertCalendarStartTime(this.date),
          endTime: this.end
        }
      },
      skip() {
        return this.skip
      },
      fetchPolicy: 'cache-first',
      loadingKey: 'loadingKey',
      update: data => data.flow_run || []
    },
    runningFlowRuns: {
      query: require('@/graphql/Calendar/calendar-running-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.convertCalendarStartTime(this.date),
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
  <v-container class="ma-2 pl-0 pt-0">
    <v-row>
      <v-col class="pa-0" cols="12" md="3" lg="2">
        <v-date-picker
          v-model="date"
          no-title
          class="small-picker pl-0"
          flat
          width="99%"
          height="200px"
        ></v-date-picker>

        <v-skeleton-loader
          type="list-item, list-item, list-item, list-item"
          min-height="329"
          height="100%"
          :loading="loadingKey > 0 || refetching"
          transition-group="quick-fade"
          class="my-2 expansion"
          tile
        >
          <v-expansion-panels class="expansion" flat :value="0">
            <v-expansion-panel
              v-for="(filter, index) in filters"
              :key="index"
              class="expansion"
            >
              <v-expansion-panel-header class="expansion py-0">
                {{ filter.name }}
              </v-expansion-panel-header>
              <v-expansion-panel-content class="expansion">
                <v-list class="expansion" height="70vh">
                  <v-list-item-group
                    v-model="selectedFlow"
                    color="primary"
                    mandatory
                    class="expansion"
                  >
                    <v-list-item
                      v-for="item in allIds"
                      :key="item ? item.id : null"
                      :value="item"
                      dense
                      class="expansion"
                    >
                      <v-list-item-content class="expansion pa-0">
                        <v-list-item-subtitle
                          class="font-weight-light expansion"
                        >
                          <FlowName :id="item" left />
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
        <v-toolbar flat color="appBackground" class="pt-0 tbar">
          <v-btn outlined class="mx-4" color="grey darken-2" @click="setToday">
            Today
          </v-btn>
          <v-spacer />
          <v-toolbar-title>
            {{ calTitle }}
          </v-toolbar-title>
          <v-spacer />
          <v-menu bottom right>
            <template #activator="{ on, attrs }">
              <v-btn
                outlined
                color="grey darken-2"
                class="mr-4"
                v-bind="attrs"
                v-on="on"
              >
                <span>{{ typeToLabel[type] }}</span>
                <v-icon right>
                  expand_more
                </v-icon>
              </v-btn>
            </template>
            <v-list>
              <v-list-item @click="type = 'day'">
                <v-list-item-title>Day</v-list-item-title>
              </v-list-item>
              <!-- <v-list-item @click="type = 'week'">
                  <v-list-item-title>Week</v-list-item-title>
                </v-list-item>
                <v-list-item @click="type = 'month'">
                  <v-list-item-title>Month</v-list-item-title>
                </v-list-item> -->
              <v-list-item @click="type = '4day'">
                <v-list-item-title>4 Days</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-toolbar>
        <CalendarDay
          v-if="flowId && !refetching"
          ref="calendar"
          :project-id="projectId"
          :date="date"
          :type="type"
          :flow-id="flowId"
          :calendar-interval="calendarInterval"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
/* stylelint-disable */
.tbar .v-toolbar__content {
  max-height: 50px;
}

.small-picker {
  .v-date-picker-table--date .v-btn {
    height: 25px;
    width: 25px;
  }

  .v-date-picker-table {
    max-height: 180px;
  }

  .v-btn:not(.v-btn--flat):not(.v-btn--text):not(.v-btn--outlined) {
    background-color: none !important;
  }

  .theme--light {
    background: #f9f9f9;
  }
}

.expansion {
  overflow: scroll;

  .theme--light.v-expansion-panels .v-expansion-panel {
    background-color: #f9f9f9 !important;
  }

  .theme--light.v-list {
    background: #f9f9f9 !important;
    background-color: #f9f9f9 !important;
  }

  .theme--light.v-sheet {
    background-color: #f9f9f9 !important;
  }

  .v-expansion-panel--active > .v-expansion-panel-header {
    min-height: 20px;
  }
}
</style>
