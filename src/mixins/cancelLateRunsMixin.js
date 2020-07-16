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
        if (run.flow?.schedules[0]?.active) {
          this.scheduleIds.push(run.flow?.schedules[0].id)
        } else {
          this.individualRuns.push(run)
        }
      })
    },
    async runMutation(mutationType) {
      const mutation = gql`
          mutation {
            ${mutationType}
          }`

      await this.$apollo.mutate({ mutation })
    },
    async clearLateRuns() {
      try {
        this.showClearLateRunsDialog = false
        this.isClearingLateRuns = true
        if (this.scheduleIds.length > 1) {
          const uniqueIds = [...new Set(this.scheduleIds)]
          const clearMutation = uniqueIds.map(
            (schedId, ind) => `
            set_schedule_inactive${ind}: set_schedule_inactive(input: { schedule_id: "${schedId}" }) {
              success,
              error
            }`
          )
          await this.runMutation(clearMutation)

          const resetMutation = uniqueIds.map(
            (schedId, ind) => `
            set_schedule_active${ind}: set_schedule_active(input: { schedule_id: "${schedId}" }) {
              success,
              error
            }`
          )

          await this.runMutation(resetMutation)
          // Cancel flow runs & task runs
        }

        if (this.individualRuns?.length > 0) {
          const statesMutation = this.individualRuns.map(
            (flowRun, fi) => `
            setFlowRunStates${fi}: setFlowRunStates(
              input: {
                states: [{
                  flowRunId: "${flowRun.id}",
                  state: {
                    type: "Cancelled"
                  },
                  version: ${flowRun.version}
                }]
              }
            ) {
              states {
                id
                status
              }
            }
            setTaskRunStates${fi}: setTaskRunStates(
              input: {
                states: [${flowRun.task_runs
                  .map(
                    taskRun => `{
                    version: ${taskRun.version},
                    taskRunId: "${taskRun.id}",
                    state: {
                      type: "Cancelled"
                    }}`
                  )
                  .join(', ')}
                  ]}) {
                    states {
                      id
                    }
                  }
                  
              `
          )
          // Build mutation to delete late flow runs.
          await this.runMutation(statesMutation)
        }

        // Refetch upcoming flows
        await this.$apollo.queries.upcoming.refetch()
      } catch (error) {
        this.clearLateRunsError = true
        this.setError({
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
