<script>
import { mapGetters, mapActions } from 'vuex'

export default {
  props: {
    flowRun: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      error: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('user', ['user']),
    restartMessage() {
      return `${this.user.username} restarted this flow run`
    },
    isFailedRun() {
      return this.flowRun.state == 'Failed' || this.failedTaskRuns
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    cancel() {
      this.$emit('cancel')
    },
    async restart() {
      this.cancel()
      try {
        const logSuccess = this.writeLogs()
        if (logSuccess) {
          let result
          let taskStates
          if (this.utilityDownstreamTasks) {
            taskStates = this.utilityDownstreamTasks.map(task => {
              return {
                version: task.task.task_runs[0].version,
                task_run_id: task.task.task_runs[0].id,
                state: { type: 'Pending', message: this.restartMessage }
              }
            })
          } else if (this.failedTaskRuns) {
            taskStates = {
              version: this.failedTaskRuns.version,
              task_run_id: this.failedTaskRuns.id,
              state: { type: 'Pending', message: this.restartMessage }
            }
          }
          if (taskStates) {
            result = await this.$apollo.mutate({
              mutation: require('@/graphql/TaskRun/set-task-run-states.gql'),
              variables: {
                input: taskStates
              }
            })
          }
          if (
            result?.data?.set_task_run_states ||
            this.flowRun.state == 'Failed'
          ) {
            const { data } = await this.$apollo.mutate({
              mutation: require('@/graphql/TaskRun/set-flow-run-states.gql'),
              variables: {
                flowRunId: this.flowRun.id,
                version: this.flowRun.version,
                state: { type: 'Scheduled', message: this.restartMessage }
              }
            })
            if (data?.set_flow_run_states) {
              this.setAlert({
                alertShow: true,
                alertMessage: 'Flow run restarted.',
                alertType: 'success'
              })
            } else {
              this.error = true
            }
          } else {
            this.error = true
          }
        }
      } catch (error) {
        this.error = true
        throw error
      }
      if (this.error === true) {
        this.setAlert({
          alertShow: true,
          alertMessage:
            'Sorry, we hit a problem trying to restart the run; please try again.',
          alertType: 'error'
        })
      }
    },
    async writeLogs() {
      const { data } = await this.$apollo.mutate({
        mutation: require('@/graphql/Update/write-run-logs.gql'),
        variables: {
          flowRunId: this.flowRun.id,
          name: this.name,
          message: this.restartMessage
        }
      })
      return data?.write_run_logs?.success
    }
  },
  apollo: {
    failedTaskRuns: {
      query: require('@/graphql/FlowRun/failed-task-runs.gql'),
      variables() {
        return {
          flowRunId: this.flowRun.id
        }
      },
      pollInterval: 5000,
      update: data => {
        if (data.task_run) {
          if (data.task_run.length > 1) {
            let taskRunString = ''
            data.task_run.forEach(taskRun => {
              taskRunString += taskRun.task_id + ','
            })
            const failedTaskRunString = taskRunString.slice(0, -1)
            return failedTaskRunString
          } else {
            return data.task_run[0]
          }
        }
      }
    },
    utilityDownstreamTasks: {
      query: require('@/graphql/TaskRun/utility_downstream_tasks.gql'),
      variables() {
        return {
          taskIds: `{${this.failedTaskRuns}}`,
          flowRunId: this.flowRun.id
        }
      },
      pollInterval: 5000,
      skip() {
        const hasFailedTRs = typeof this.failedTaskRuns === 'string'
        return !hasFailedTRs
      },
      update: data => data.utility_downstream_tasks
    }
  }
}
</script>

<template>
  <v-card tile>
    <v-card-title>
      Restart from failed?
    </v-card-title>

    <v-card-text>
      Click on confirm to restart
      <span class="font-weight-bold">{{ flowRun.name }}</span>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>

      <v-tooltip bottom>
        <template v-slot:activator="{ on }">
          <div v-on="on">
            <v-btn
              :disabled="!isFailedRun"
              color="primary"
              @click="restart"
              v-on="on"
            >
              Confirm
            </v-btn>
          </div>
        </template>
        <span v-if="role === 'READ_ONLY_USER'">
          Read-only users cannot restart flow runs
        </span>
        <span v-else-if="!isFailedRun">
          You can only restart a flow run.
        </span>
      </v-tooltip>

      <v-btn text @click="cancel">
        Cancel
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
