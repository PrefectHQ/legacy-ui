<script>
import { mapGetters } from 'vuex'

import CardTitle from '@/components/Card-Title'

export default {
  components: {
    CardTitle
  },

  props: {
    agent: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      matchedFlows: []
    }
  },
  computed: {
    ...mapGetters('agent', ['staleThreshold', 'unhealthyThreshold']),
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    labelsAlign() {
      if (!this.flows?.length) {
        this.labelMessage('You have no flows')
        return false
      }
      if (
        !this.agent?.labels?.length &&
        this.flows.every(flow => flow.labels.length > 0)
      ) {
        this.labelMessage(
          "You have no currently registered flows that match this agent's labels.  You will need to edit your flows' labels"
        )
        return false
      } else {
        let matchingLabels = 0
        if (this.flows) {
          this.flows.forEach(flow => {
            if (
              this.agent.labels.every(label => flow?.labels?.includes(label))
            ) {
              this.addMatchingFlow(flow)
              matchingLabels++
            }
          })
        }
        if (matchingLabels > 0) {
          this.labelMessage('Your flow and agent labels look good.')
          return true
        } else {
          this.labelMessage(
            "It looks like no currently running Agent has this agent's full set of labels."
          )
          return false
        }
      }
    }
  },
  methods: {
    labelMessage(text) {
      this.labelMessageText = text
    },
    addMatchingFlow(flow) {
      if (!this.matchedFlows.filter(item => item.id === flow.id).length)
        this.matchedFlows.push(flow)
    },
    flowName(flow) {
      return flow?.flows[0]?.name
    }
  },
  apollo: {
    flows: {
      query: require('@/graphql/Agent/FlowGroups.gql'),
      loadingKey: 'loading',
      pollInterval: 50000,
      update: data => data?.flow_group
    }
  }
}
</script>

<template>
  <v-card tile class="agent-card px-2 pb-3" style="overflow-y: auto;">
    <CardTitle
      title="Matching Flows"
      subtitle="Flows which have matching labels"
      icon="pi-flow"
    >
    </CardTitle>

    <v-card-text class="py-0">
      <v-sheet height="300px" :style="{ overflow: 'auto' }">
        <v-list v-if="labelsAlign">
          <v-list-item
            v-for="(flow, index) in matchedFlows"
            :key="index"
            class="pa-0"
          >
            <v-list-item-content class="pa-0">
              <v-list-item-title>
                {{ flowName(flow) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ flow.id }}
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-sheet>
    </v-card-text>

    <v-card-actions class="pa-0"> </v-card-actions>
  </v-card>
</template>
