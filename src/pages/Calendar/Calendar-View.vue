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
      selectedFlow: 0,
      filters: [{ name: 'Flows' }],
      loadingKey: 0,
      refetching: false
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    ...mapGetters('api', ['backend']),
    flowId() {
      if (this.$route.params.id) return this.$route.params.id
      if (this.selectedFlow) return this.selectedFlow
      if (this.allIds && this.allIds[0]) return this.allIds[0]
      return ''
    },
    allRuns() {
      if (this.flowRuns || this.scheduledFlowRuns)
        return [...this.flowRuns, ...this.scheduledFlowRuns]
      return []
    },
    allIds() {
      const flowIds = this.allRuns?.map(flowRun => flowRun.flow_id)
      return flowIds
        ? [...new Set(flowIds, this.$route.params.id)]
        : [this.$route.params.id]
    },
    end() {
      return this.addDay(this.date, 1)
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
    }
  }
}
</script>

<template>
  <v-container class="ma-2 pl-0 lighter">
    <v-row>
      <v-col class="pa-0" cols="12" md="3" lg="2">
        <v-sheet color="appBackground" class="lighter" elevation="0">
          <v-date-picker
            v-model="date"
            no-title
            class="small-picker pl-0"
            flat
            color="primary"
            width="99%"
            height="200px"
          ></v-date-picker>
          <!-- <v-time-picker v-model="start" :max="end"></v-time-picker>
        <v-time-picker v-model="end" :max="start"></v-time-picker> -->
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
                <v-expansion-panel-header class="expansion">
                  {{ filter.name }}
                </v-expansion-panel-header>
                <v-expansion-panel-content class="expansion">
                  <v-list class="expansion">
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
                        <v-list-item-content class="expansion">
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
        </v-sheet>
      </v-col>
      <v-col class="pa-0" cols="12" md="9" lg="10">
        <CalendarDay
          v-if="flowId && !refetching"
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

<style lang="scss">
.small-picker {
  .v-date-picker-table--date .v-btn {
    height: 25px;
    width: 25px;
  }

  .v-date-picker-table {
    max-height: 200px;
  }

  .theme--light {
    background-color: #f9f9f9 !important;
  }
}

.expansion {
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
}
</style>
