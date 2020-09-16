import gql from 'graphql-tag'
import { mapActions } from 'vuex'

export const cancelLateRunsMixin = {
  data() {
    return {
      // Clearing late runs
      clearLateRunsError: false,
      isClearingLateRuns: false,
      showClearLateRunsDialog: false,
      individualRuns: [],
      scheduleIds: []
    }
  },
  watch: {
    lateRuns() {
      if (this.lateRuns?.length === 0 && this.isClearingLateRuns) {
        this.isClearingLateRuns = false
      }
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    handleOpenDialog() {
      this.IdCheck()
      this.showClearLateRunsDialog = true
    },
    IdCheck() {
      return this.lateRuns?.map(run => {
        if (run.flow?.is_schedule_active) {
          this.ids.push(run.flow?.id)
        } else {
          this.individualRuns.push(run)
        }
      })
    },
    async runMutation(mutationType) {
      const mutation = gql`
          mutation CancelLateRuns {
            ${mutationType}
          }`

      await this.$apollo.mutate({ mutation })
    },
    async clearLateRuns() {
      try {
        this.showClearLateRunsDialog = false
        this.isClearingLateRuns = true
        if (this.scheduleIds.length > 1) {
          const uniqueIds = [...new Set(this.ids)]
          const clearMutation = uniqueIds.map(
            (id, ind) => `
            set_schedule_inactive${ind}: set_schedule_inactive(input: { flow_id: "${id}" }) {
              success,
              error
            }`
          )
          await this.runMutation(clearMutation)

          const resetMutation = uniqueIds.map(
            (id, ind) => `
            set_schedule_active${ind}: set_schedule_active(input: { flow_id: "${id}" }) {
              success,
              error
            }`
          )

          await this.runMutation(resetMutation)
          // Cancel flow runs & task runs
        }

        // There's probably a better way to handle the JSON stringy conversion here.
        if (this.individualRuns?.length > 0) {
          const statesMutation = `
            set_flow_run_states(
              input: {
                states: [${this.individualRuns.map(r => {
                  return `{
                    flow_run_id: "${r.id}",
                    state: ${JSON.stringify(
                      '{"type": "Cancelled","message": "This run was late and so was cancelled from the UI."}'
                    )},
                    version: ${r.version}
                  }`
                })}]
              }
            ) {
              states {
                status
              }
            }
          `

          // Build mutation to delete late flow runs.
          await this.runMutation(statesMutation)
        }

        // Refetch upcoming flows
        await this.$apollo.queries.upcoming.refetch()
      } catch (error) {
        this.clearLateRunsError = true
        this.setAlert({
          alertShow: true,
          alertMessage:
            'Something went wrong while trying to clear your late flow runs. Please try again later.',
          alertType: 'error'
        })
        throw error
      }
    }
  }
}
