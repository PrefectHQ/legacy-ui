import { mapActions, mapGetters } from 'vuex'

export const labelCheckMixin = {
  data() {
    return {}
  },
  computed: {
    ...mapGetters('agent', ['agentLabels']),
    flowLabels() {
      const labels = this.flowGroup?.labels || this.flow?.environment?.labels
      return labels
    }
  },
  methods: {
    ...mapActions('agent', ['getAgents']),
    checkLabels() {
      if (!this.flowLabels.length && this.agentLabels) {
        this.labelMessage = `Your flow has no labels and your agents have the following labels: ${this.agentLabels}.  To let the agent pick up this flow run, you will need to add one of these labels to you flow.`
        return false
      } else {
        let matchingLabels = 0
        this.agentLabels.forEach(array => {
          if (this.flowLabels.every(label => array.includes(label)))
            matchingLabels++
        })
        if (matchingLabels > 0) {
          return true
        } else {
          console.log(this.flowLabels)
          this.labelMessage = `You have a mismatch between your flow and agent labels.  Your flow labels are: ${this.flowLabels} and your agent labels are: Agent1: ${this.agentLabels[0]} Agent 2: ${this.agentLabels[1]}`
          return false
        }
      }
    }
  }
}
