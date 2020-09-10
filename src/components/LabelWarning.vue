<script>
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
    }
  },
  data() {
    return {
      infoMessage: '',
      docsMessage: '',
      docsLink: ''
    }
  },
  computed: {
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
          'You have no live agents.  This will stop your flow run from starting.',
          'agents',
          'https://docs.prefect.io/orchestration/agents/overview.html'
        )
        return false
      }
      if (!this.flowLabels.length && this.agentLabels.length) {
        this.labelMessage(
          `Your flow has no labels and your agents have the following labels: ${this.agentLabels}.  To let the agent pick up this flow run, you will need to add one of these labels to you flow.`
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
          return true
        } else {
          this.labelMessage(
            `You have a mismatch between your flow and agent labels.  Your flow labels are: ${this.flowLabels} and your agent labels are: ${this.agentLabels} }`
          )
          return false
        }
      }
    }
  },
  methods: {
    labelMessage(message, docsMessage, link) {
      this.infoMessage = message
      this.docsMessage = docsMessage
      this.docsLink = link
    }
  }
}
</script>

<template>
  <v-menu
    v-if="!labelsAlign"
    :close-on-content-click="false"
    offset-y
    open-on-hover
  >
    <template v-slot:activator="{ on }">
      <v-btn text icon v-on="on">
        <v-icon color="error" size="x-large">
          label
        </v-icon>
        <v-icon class="position-absolute" color="white" size="small">
          priority_high
        </v-icon>
      </v-btn>
    </template>
    <v-card tile class="pa-0" max-width="320">
      <v-card-title class="subtitle pb-1">Label Problem</v-card-title>

      <v-card-text class="pt-0">
        <div>{{ infoMessage }} </div>
        <div>For more information check-out</div>
        <a :href="docsLink" target="_blank">the docs on {{ docsMessage }}</a
        >.
      </v-card-text>
    </v-card>
  </v-menu>
</template>
