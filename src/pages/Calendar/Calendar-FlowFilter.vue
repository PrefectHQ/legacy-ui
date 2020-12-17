<script>
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'
import FlowName from '@/pages/Calendar/FlowName'

export default {
  components: {
    FlowName
  },
  mixins: [formatTime],
  props: {
    day: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      filters: [{ name: 'Flows' }],
      skip: false,
      show: true,
      loadingKey: 0,
      Ids: null,
      flowGroupIds: []
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    ...mapGetters('api', ['backend']),
    start() {
      let days = 1
      const start =
        this.tzOffset(this.day) < 0
          ? this.subtractDay(this.day, days)
          : this.day
      return start
    },
    end() {
      let days = 1
      switch (this.type) {
        case '4day':
          days = this.tzOffset(this.day) > 0 ? 5 : 4
          break
        case 'day':
          days = this.tzOffset(this.day) > 0 ? 2 : 1
          break
      }
      return this.addDay(this.day, days)
    },
    queryVariables() {
      return {
        startTime: this.start,
        endTime: this.end
      }
    },
    allIds() {
      const allRuns =
        new Date(this.day) < new Date()
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
      const selected = this.selectFlow ? this.selectFlow[0] : null
      const flowIds = allRuns?.reduce((accum, flowRun) => {
        if (flowRun.flow_id !== selected) {
          accum.push([flowRun.flow_id, 'active'])
        }
        return accum
      }, [])
      const flowGroupIds = this.allFlows?.reduce((accum, flowGroup) => {
        if (flowGroup.flows[0]?.id && flowGroup.flows[0]?.id !== selected) {
          accum.push([flowGroup.flows[0].id, `${flowGroup.flows[0].name}`])
        }
        return accum
      }, [])
      const allIds =
        flowIds && flowGroupIds ? new Map([...flowGroupIds, ...flowIds]) : []
      const runs = [...allIds]
      const ordered = runs.sort((a, b) =>
        a[1] === 'active'
          ? -1
          : b[1] === 'active'
          ? 1
          : a[1] > b[1]
          ? 1
          : b[1] > a[1]
          ? -1
          : 0
      )
      if (this.selectFlow) ordered.unshift(this.selectFlow)
      return ordered
    }
  },
  watch: {
    async tenant() {
      this.selectFlow = null
      this.$apollo.queries.flowRuns.refetch()
      this.$apollo.queries.scheduledFlowRuns.refetch()
      this.$apollo.queries.ongoingFlowRuns.refetch()
      this.$apollo.queries.runningFlowRuns.refetch()
      this.$apollo.queries.allFlows.refetch()
    },
    async backend() {
      this.selectFlow = null
      this.$apollo.queries.flowRuns.refetch()
      this.$apollo.queries.scheduledFlowRuns.refetch()
      this.$apollo.queries.ongoingFlowRuns.refetch()
      this.$apollo.queries.runningFlowRuns.refetch()
      this.$apollo.queries.allFlows.refetch()
    },
    allIds(val) {
      if (val[0] && !this.selectFlow) this.$emit('update', this.allIds[0][0])
    },
    day() {
      this.flowGroupIds = []
    }
  },
  created() {
    //creates a non-reactive property that isn't tracked by Vue - so that allIds does not reset
    this.selectFlow = null
    this.$emit('update', this.allIds[0])
  },
  methods: {
    handleSelectedFlow(flow) {
      this.selectFlow = flow
      this.$emit('update', flow[0])
    },
    updateFlowGroupList(flowGroupId) {
      this.flowGroupIds.push(flowGroupId)
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Calendar/calendar-flow-runs.gql'),
      variables() {
        return {
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
        return this.queryVariables
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
        return this.queryVariables
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
          startTime: this.start,
          endTime: this.day
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
  <div class="expansion text-center">
    <v-expansion-panels class="expansion" flat :value="0">
      <v-expansion-panel v-for="(filter, index) in filters" :key="index">
        <v-expansion-panel-header class=" py-0">
          {{ filter.name }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-progress-circular
            v-if="loadingKey > 0"
            class="circular"
            :active="loadingKey > 0"
            :indeterminate="loadingKey > 0"
            color="primary"
            width="3"
            size="50"
          ></v-progress-circular>
          <v-list v-else height="60vh" class="pt-0">
            <v-list-item-group :value="selectFlow" color="primary" mandatory>
              <v-list-item
                v-for="(item, inde) in allIds"
                :key="inde"
                :value="item"
                dense
              >
                <v-list-item-content
                  class=" pa-0"
                  @click="handleSelectedFlow(item)"
                >
                  <v-list-item-subtitle class="font-weight-light ">
                    <FlowName
                      v-if="item"
                      :id="item[0]"
                      left
                      :fg-ids="flowGroupIds"
                      :active="item[1] === 'active'"
                      @fg="updateFlowGroupList"
                    />
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<style lang="scss">
/* stylelint-disable */

.expansion > div {
  overflow: auto;
  background-color: #f9f9f9 !important;

  .theme--light > div {
    background-color: #f9f9f9 !important;
  }

  .v-expansion-panel-header {
    min-height: 20px;
  }
}

.circular {
  padding-top: 100px !important;
}
</style>
