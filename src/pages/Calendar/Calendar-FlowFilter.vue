<script>
import { mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'
import FlowName from '@/pages/Calendar/FlowName'

export default {
  components: {
    FlowName
  },
  filters: {},
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
      selectedFlow: null,
      loadingKey: 0,
      refetching: false,
      Ids: null
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
        this.tzOffset(this.date) < 0
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
      return this.addDay(this.date, days)
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
          accum.push([flowGroup.flows[0].id, 'inactive'])
        }
        return accum
      }, [])
      const allIds =
        flowIds && flowGroupIds ? new Map([...flowGroupIds, ...flowIds]) : []
      const runs = [...allIds]
      const ordered = runs.sort(a => (a[1] === 'active' ? -1 : 1))
      if (this.selectFlow) ordered.unshift(this.selectFlow)
      return ordered
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
      await this.$apollo.queries.flowRuns.refetch()
      await this.$apollo.queries.scheduledFlowRuns.refetch()
      this.refetching = false
    },
    allIds(val) {
      if (val[0]) this.$emit('update', this.allIds[0][0])
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
        return {
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
      <v-expansion-panel v-for="(filter, index) in filters" :key="index">
        <v-expansion-panel-header class=" py-0">
          {{ filter.name }}
        </v-expansion-panel-header>
        <v-expansion-panel-content>
          <v-list height="70vh">
            <v-list-item-group v-model="selectedFlow" color="primary" mandatory>
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
                    <FlowName :id="item[0]" left :icon="item[1]" />
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-expansion-panel-content>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-skeleton-loader>
</template>

<style lang="scss">
/* stylelint-disable */

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
