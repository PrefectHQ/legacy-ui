import { mapActions, mapGetters } from 'vuex'

import { FINISHED_STATES } from '@/utils/states'

export const changeStateMixin = {
  props: {
    taskRun: {
      default: null,
      type: Object
    },
    flowRun: {
      default: null,
      type: Object
    },
    dialogType: {
      required: true,
      type: String
    }
  },
  data() {
    return {
      markAsDialog: false,
      markAsLoading: false,
      resumeLoad: '',
      reason: '',
      e1: 1,
      formError: false,
      name: 'PrefectUIRunMarkAsButton',
      setStateError: false,
      selectedState: '',
      allTasks: false,
      cancelLoad: false,
      setStateSuccessA: false,
      setStateSuccessB: false,
      alertMessage: 'We hit a problem.  Please try marking the state again.',
      taskStates: [
        'Finished',
        'Success',
        'Skipped',
        'Failed',
        'Looped',
        'Mapped',
        'Cached',
        'TimedOut',
        'Paused',
        'Resume',
        'TriggerFailed'
      ],
      flowStates: [
        { header: 'Finished States' },
        { divider: '...' },
        'Failed',
        'Success',
        'Mapped',
        'Finished',
        'Cached',
        'Skipped',
        'TriggerFailed',
        'TimedOut',
        'Cancelled',
        { header: 'Scheduled - To Re-run Flow Run' },
        { divider: '...' },
        'Scheduled',
        { header: 'Pending States' },
        { divider: '...' },
        'Pending',
        'Paused'
      ]
    }
  },
  computed: {
    ...mapGetters('user', ['user']),
    ...mapGetters('tenant', ['role']),
    isFinished() {
      return FINISHED_STATES.includes(this.flowRun.state)
    },
    isFinishing() {
      return (
        this.flowRun.state == 'Cancelling' ||
        FINISHED_STATES.includes(this.flowRun.state)
      )
    },
    filteredStates() {
      if (this.dialogType === 'task run') {
        return this.taskStates.filter(state => state !== this.taskRun.state)
      } else {
        return this.flowStates.filter(state => state !== this.flowRun.state)
      }
    },
    checkVersion() {
      let split = this.flowRun?.flow?.core_version.split('.')

      let major = parseInt(split[0]),
        minor = parseInt(split[1]),
        patch = parseInt(split[2])

      return major >= 1 || (minor >= 13 && patch >= 0)
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    runLogMessage() {
      if (this.dialogType == 'resume') {
        return `Task ${this.taskRun.task.name} approved by ${this.user.username}`
      } else if (this.reason) {
        return `${this.user.username || 'User'} marked ${this.dialogType} as ${
          this.selectedState
        } because "${this.reason}"`
      } else {
        return `${this.user.username || 'User'} marked ${this.dialogType} 
        as ${this.selectedState}`
      }
    },
    activeButton() {
      if (this.role === 'READ_ONLY_USER') return false
      if (this.dialogType === 'task run') {
        if (this.taskRun.state === 'Running') return true
        return !!this.taskStates.includes(this.taskRun.state)
      } else if (this.dialogType === 'flow run') {
        return true
      }
    },
    async writeLogs() {
      const { data } = await this.$apollo.mutate({
        mutation: require('@/graphql/Update/write-run-logs.gql'),
        variables: {
          flowRunId: this.taskRun ? this.taskRun.flow_run?.id : this.flowRun.id,
          taskRunId: this.taskRun ? this.taskRun.id : null,
          name: this.name,
          message: this.runLogMessage()
        }
      })
      return data?.write_run_logs?.success
    },
    resumeRun() {
      this.resumeLoad = this.taskRun.id
      this.selectedState = 'Resume'
      this.alertMessage =
        'An error occurred when approving this task run. Please try again.'
      this.changeState()
    },
    async cancelFlowRun() {
      this.cancelLoad = true
      this.selectedState = 'Cancelled'
      this.allTasks = true

      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/FlowRun/cancel-flow-run.gql'),
          variables: {
            flowRunId: this.flowRun.id
          }
        })

        this.setAlert({
          alertShow: true,
          alertMessage:
            'Your flow run will be cancelled; please allow some time for this to take effect.',
          alertType: 'success'
        })
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage:
            'Something went wrong when trying to cancel this flow run, please try again.',
          alertType: 'error'
        })
      }

      this.cancelLoad = false
    },
    async changeState() {
      try {
        this.markAsLoading = true
        const logSuccess = this.writeLogs()
        if (logSuccess) {
          if (
            this.dialogType === 'task run' ||
            this.dialogType == 'resume' ||
            (this.allTasks && this.flowRun.task_runs.length)
          ) {
            let taskState
            if (this.dialogType === 'task run' || this.dialogType == 'resume') {
              taskState = {
                task_run_id: this.taskRun.id,
                version: this.taskRun.version,
                state: {
                  type: this.selectedState,
                  message: this.runLogMessage()
                }
              }
            } else {
              taskState = this.flowRun.task_runs.map(taskRun => {
                return {
                  version: taskRun.version,
                  task_run_id: taskRun.id,
                  state: {
                    type: this.selectedState,
                    message: this.runLogMessage()
                  }
                }
              })
            }
            const result = await this.$apollo.mutate({
              mutation: require('@/graphql/TaskRun/set-task-run-states.gql'),
              variables: {
                input: taskState
              }
            })
            this.setStateSuccessA =
              result?.data?.set_task_run_states?.states?.length
            if (!this.setStateSuccessA) {
              this.setStateError = true
            }
          }
          if (this.dialogType === 'flow run') {
            const result = await this.$apollo.mutate({
              mutation: require('@/graphql/TaskRun/set-flow-run-states.gql'),
              variables: {
                flowRunId: this.flowRun.id,
                version: this.flowRun.version,
                state: {
                  type: this.selectedState,
                  message: this.runLogMessage()
                }
              }
            })
            this.setStateSuccessB =
              result?.data?.set_flow_run_states?.states?.length
            if (!this.setStateSuccessB) {
              this.setStateError = true
            }
          }
        } else {
          this.setStateError = true
        }
      } catch (error) {
        this.setStateError = true
      }
      if (this.setStateError) {
        this.setAlert({
          alertShow: true,
          alertMessage: this.alertMessage,
          alertType: 'error'
        })
      }
      if (
        this.setStateSuccessA &&
        this.setStateSuccessB &&
        this.cancelLoad &&
        !this.setStateError
      ) {
        this.setAlert({
          alertShow: true,
          alertMessage:
            'Your flow run will be cancelled; please allow some time for this to take effect.',
          alertType: 'success'
        })
      }
      setTimeout(() => this.reset(), 500)
    },
    checkContinue() {
      if (this.selectedState) {
        this.e1 = 2
      }
    },
    reset() {
      this.markAsDialog = false
      this.markAsLoading = false
      this.reason = ''
      this.form = false
      this.setStateError = false
      this.e1 = 1
      this.selectedState = ''
      this.allTasks = false
      this.cancelLoad = false
      this.alertMessage =
        'We hit a problem. Please try marking the state again.'
      this.setStateSuccessA = false
      this.setStateSuccessB = false
      this.cancelLoad = false
      this.resumeLoad = ''
    }
  }
}
