export const labelCheckMixin = {
  data() {
    return {}
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
      if (!this.agents) {
        this.labelMessage = 'You have no live agents'
        return false
      }
      if (!this.flowLabels.length && this.agentLabels.length) {
        this.labelMessage = `Your flow has no labels and your agents have the following labels: ${this.agentLabels}.  To let the agent pick up this flow run, you will need to add one of these labels to you flow.`
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
          this.labelMessage = `You have a mismatch between your flow and agent labels.  Your flow labels are: ${this.flowLabels} and your agent labels are: ${this.agentLabels} }`
          return false
        }
      }
    }
  }
}
