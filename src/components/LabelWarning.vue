<script>
import { mapGetters } from 'vuex'
export default {
  props: {
    flow: {
      type: Object,
      default: () => {}
    },
    flowGroup: {
      type: Object,
      default: () => {}
    },
    agents: {
      type: Array,
      default: null
    },
    iconSize: {
      type: String,
      required: false,
      default: null
    },
    always: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      infoMessage: '',
      docsName: '',
      docsLink: ''
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    agentOrLabel() {
      if (!this.agents) return 'Agent Problem'
      if (!this.labelsAlign) return 'Label Problem'
      return 'Flow and Agent Labels'
    },
    agentLabels() {
      if (this.agents) {
        const labels = this.agents.reduce((accumulator, agent) => {
          accumulator.push(agent.labels)
          return accumulator
        }, [])
        return labels
      }
      return null
    },
    flowLabels() {
      const labels =
        this.newLabels ||
        this.flowGroup?.labels ||
        this.flow?.environment?.labels
      return labels
    },
    labelsAlign() {
      if (!this.agents) return
      if (!this.agents.length) {
        this.labelMessage(
          'You have no live agents.  Flow runs will not be picked up.',
          'agents',
          'https://docs.prefect.io/orchestration/agents/overview.html'
        )
        return false
      }
      if (!this.flowLabels.length && this.agentLabels.length) {
        this.labelMessage(
          'To let the agent pick up this flow run, you may need to add labels to your flow.',
          'Labels and Flow Affinity',
          'https://docs.prefect.io/orchestration/agents/overview.html#flow-affinity-labels'
        )
        return false
      } else {
        let matchingLabels = 0
        if (this.agentLabels) {
          this.agentLabels.forEach(array => {
            if (this.flowLabels.every(label => array.includes(label)))
              matchingLabels++
          })
        }
        if (matchingLabels > 0) {
          this.labelMessage(
            'Labels and Flow Affinity',
            'https://docs.prefect.io/orchestration/agents/overview.html#flow-affinity-labels'
          )
          return true
        } else {
          this.labelMessage(
            'To let the agent pick up this flow run, you need to align your flow and agents label.',
            'Labels and Flow Affinity',
            'https://docs.prefect.io/orchestration/agents/overview.html#flow-affinity-labels'
          )
          return false
        }
      }
    }
  },
  methods: {
    labelMessage(message, docsName, link) {
      this.infoMessage = message
      this.docsName = docsName
      this.docsLink = link
    }
  }
}
</script>

<template>
  <v-menu
    v-if="always || !labelsAlign"
    :close-on-content-click="false"
    offset-y
    open-on-hover
  >
    <template v-slot:activator="{ on }">
      <v-btn text icon v-on="on">
        <v-icon
          :color="labelsAlign ? 'info' : 'error'"
          :size="iconSize || 'xx-large'"
        >
          label
        </v-icon>
        <v-icon class="position-absolute" color="white" size="small">
          priority_high
        </v-icon>
      </v-btn>
    </template>
    <v-card tile class="pa-0" max-width="320">
      <v-card-title class="subtitle pb-1">{{ agentOrLabel }} </v-card-title>

      <v-card-text class="pt-0">
        <div> {{ infoMessage }}</div>
        You can see you agent labels in the
        <router-link
          :to="{
            name: 'dashboard',
            params: { tenant: tenant.slug },
            query: { agents: '' }
          }"
        >
          <span>agents tab</span></router-link
        >
        You can see and edit you flow labels in the
        <router-link
          :to="{
            name: 'flow',
            params: { id: flow.id, tenant: tenant.slug }
          }"
          >flow details tile</router-link
        >
        <div class="mt-4">
          For more information check-out
          <a :href="docsLink" target="_blank">the docs on {{ docsName }}</a>
          .</div
        >
      </v-card-text>
    </v-card>
  </v-menu>
</template>
