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
      selectedFlow: null,
      selectFlow: null,
      filters: [{ name: 'Flows' }],
      loadingKey: 0,
      refetching: false,
      type: 'day',
      typeToLabel: {
        day: 'Day',
        '4day': '4 Days'
      },
      Ids: null
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    ...mapGetters('api', ['backend']),
    flowId() {
      if (this.selectedFlow) return this.selectedFlow[0]
      if (this.allIds && this.allIds[0]) return this.allIds[0][0]
      return ''
    },
    allRuns() {
      if (this.flowRuns || this.scheduledFlowRuns || this.runningFlowRuns) {
        return new Date(this.date) < new Date()
          ? [
              ...(this.flowRuns ? this.flowRuns : []),
              ...(this.scheduledFlowRuns ? this.scheduledFlowRuns : []),
              ...(this.runningFlowRuns ? this.runningFlowRuns : []),
              ...(this.ongoingFlowRuns ? this.ongoingFlowRuns : [])
            ]
          : [
              ...(this.flowRuns ? this.flowRuns : []),
              ...(this.scheduledFlowRuns ? this.scheduledFlowRuns : [])
            ]
      }
      return []
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
    },
    calTitle() {
      return this.getMonth(this.date)
    },
    allIds() {
      const flowIds = this.allRuns?.map(flowRun => {
        return flowRun.flow_id === this.selectFlow
          ? [flowRun.flow_id, 'selected']
          : [flowRun.flow_id, 'active']
      })
      let flowGroupIds = []
      this.allFlows?.forEach(flowGroup => {
        if (flowGroup.flows[0]?.id)
          flowGroup.flows[0].id === this.selectFlow
            ? flowGroupIds.push([flowGroup.flows[0].id, 'selected'])
            : flowGroupIds.push([flowGroup.flows[0].id, 'inactive'])
      })
      const allIds =
        flowIds && flowGroupIds ? new Map([...flowGroupIds, ...flowIds]) : []
      return [...allIds]
    }
  },
  watch: {
    async tenant() {
      this.refetching = true
      this.allIds = null
      this.allRuns = null
      this.selectedFlow = null
      await this.$apollo.queries.flowRuns.refetch()
      await this.$apollo.queries.scheduledFlowRuns.refetch()
      this.refetching = false
    },
    async backend() {
      this.refetching = true
      this.selectedFlow = null
      this.allIds = null
      this.allRuns = null
      await this.$apollo.queries.flowRuns.refetch()
      await this.$apollo.queries.scheduledFlowRuns.refetch()
      this.refetching = false
    },
    date() {
      this.Ids = null
      this.orderIds()
    }
  },
  methods: {
    setToday() {
      this.date = this.formatCalendarDate(new Date())
    },
    orderIds() {
      const ordered = [...this.allIds]
      ordered.sort((a, b) =>
        a[1] === 'selected'
          ? -1
          : b[1] === 'selected'
          ? 1
          : a[1] === 'active'
          ? -1
          : b[1] === 'active'
          ? -1
          : 0
      )
      this.Ids = ordered
    },
    handleSelectedFlow(flow) {
      flow[1] = 'selected'
      this.selectFlow = flow[0]
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Calendar/calendar-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.start,
          endTime: this.end
        }
      },
      skip() {
        return this.skip
      },
      loadingKey: 'loadingKey',
      update: data => data.flow_run
    },
    scheduledFlowRuns: {
      query: require('@/graphql/Calendar/calendar-scheduled-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.start,
          endTime: this.end
        }
      },
      skip() {
        return this.skip
      },
      loadingKey: 'loadingKey',
      update: data => data.flow_run || []
    },
    runningFlowRuns: {
      query: require('@/graphql/Calendar/calendar-running-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.start,
          endTime: this.end
        }
      },
      skip() {
        return this.skip
      },
      loadingKey: 'loadingKey',
      update: data => data.flow_run || []
    },
    ongoingFlowRuns: {
      query: require('@/graphql/Calendar/calendar-ongoing-flow-runs.gql'),
      variables() {
        return {
          project_id: this.projectId == '' ? null : this.projectId,
          startTime: this.start,
          endTime: this.date
        }
      },
      skip() {
        return this.skip
      },
      loadingKey: 'loadingKey',
      update: data => data.flow_run || []
    },
    allFlows: {
      query: require('@/graphql/Calendar/calendar-flow-groups.gql'),
      variables() {
        return {}
      },
      skip() {
        return this.skip
      },
      loadingKey: 'loadingKey',
      update: data => data.flow_group
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
          <v-expansion-panels
            v-if="allIds && allIds.length"
            class="expansion"
            flat
            :value="0"
          >
            <v-expansion-panel v-for="(filter, index) in filters" :key="index">
              <v-expansion-panel-header class=" py-0">
                {{ filter.name }}
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-list height="70vh">
                  <v-list-item-group
                    v-model="selectedFlow"
                    color="primary"
                    mandatory
                  >
                    <v-list-item
                      v-for="(item, inde) in Ids || allIds"
                      :key="inde"
                      :value="item"
                      dense
                    >
                      <v-list-item-content
                        class=" pa-0"
                        @click="handleSelectedFlow(item)"
                      >
                        <v-list-item-subtitle class="font-weight-light ">
                          <FlowName :id="item[0]" left :icon="item[1]" />
                        </v-list-item-subtitle>
                      </v-list-item-content>
                    </v-list-item>
                  </v-list-item-group>
                </v-list>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
          <div v-else class="pa-4 subtitle-1">
            <v-icon color="grey" class="pr-2">warning</v-icon> No flow run
            activity on this date!
          </div>
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
              <v-list-item @click="type = '4day'">
                <v-list-item-title>4 Days</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </v-toolbar>

        <CalendarDay
          v-if="flowId && !refetching && loadingKey < 1"
          :project-id="projectId"
          :date="date"
          :type="type"
          :flow-id="flowId"
          :runs="allRuns"
          :calendar-interval="calendarInterval"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss">
/* stylelint-disable */
.tbar {
  max-height: 50px;
  .v-toolbar__content {
    max-height: 50px;
  }
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
  overflow: auto;

  .theme--light.v-expansion-panels .v-expansion-panel {
    background-color: #f9f9f9 !important;
  }

  .theme--light {
    background-color: #f9f9f9 !important;
  }

  .v-expansion-panel--active .v-expansion-panel-header {
    min-height: 20px;
  }
}
</style>
