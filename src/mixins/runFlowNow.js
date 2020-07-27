export const runFlowNowMixin = {
  data() {
    return {
      // Alert
      showAlert: false,
      alertMessage: '',
      alertLink: {},
      alertType: 'info',
      setToRun: []
    }
  },
  methods: {
    async runFlowNow(flowRunId, version, name) {
      this.setToRun.push(flowRunId)
      try {
        // Set the flow in a Scheduled state (even if it's already Scheduled).
        // This causes the flow run to execute immediately.
        await this.$apollo.mutate({
          mutation: require('@/graphql/TaskRun/set-flow-run-states.gql'),
          variables: {
            flowRunId: flowRunId,
            version: version,
            state: {
              type: 'Scheduled'
            }
          }
        })
        this.alertMessage = `Your flow run ${name} has been scheduled to start immediately.`
        this.alertLink = { name: 'flow-run', params: { id: flowRunId } }
        this.alertType = 'success'
        this.showAlert = true
      } catch (error) {
        this.alertMessage =
          'Something went wrong while trying to run this flow. Please try again later.'
        this.alertType = 'error'
        this.showAlert = true
        this.isRunningNow = false
        this.setToRun.pop(flowRunId)

        throw error
      }
    }
  }
}
