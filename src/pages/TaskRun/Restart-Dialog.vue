<script>
import { ERROR_MESSAGE } from '@/utils/error'
import { mapGetters, mapActions } from 'vuex'

export default {
  props: {
    taskRun: {
      required: true,
      type: Object
    },
    flowRunId: {
      required: true,
      type: String
    }
  },
  data() {
    return {
      error: ERROR_MESSAGE,
      tasksSuccess: true,
      name: 'PrefectCloudUIRestartButton'
    }
  },
  computed: {
    ...mapGetters('user', ['user']),
    ...mapGetters('tenant', ['role']),
    ...mapGetters('license', ['hasPermission']),
    permissionsCheck() {
      return !this.hasPermission('update', 'run')
    },
    message() {
      return `Flow run restarted by ${this.user.username}`
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    cancel() {
      this.$emit('cancel')
    },
    runOrReRunMessage(oldState) {
      const state = oldState ? oldState : this.taskRun.state
      return state !== 'Pending'
        ? `re-run task ${this.taskRun.task.name} and its downstream dependents`
        : `run task ${this.taskRun.task.name} and any other pending task runs`
    },
    raiseWarning() {
      const hasCachedInput = Object.keys(
        this.taskRun?.serialized_state?.cached_inputs
      )?.length
      const hasUpstreamEdges = this.taskRun?.task?.upstream_edges?.filter(
        edge => edge.key
      )?.length
      return !!hasUpstreamEdges && !hasCachedInput
    },
    async restart() {
      const oldState = this.taskRun.state
      this.cancel()
      try {
        this.dialog = false
        await this.writeLogs()
        let taskStates = []
        if (this.utilityDownstreamTasks.length) {
          taskStates = this.utilityDownstreamTasks.map(task => {
            return {
              version: task.task.task_runs[0].version,
              task_run_id: task.task.task_runs[0].id,
              state: { type: 'Pending', message: this.message }
            }
          })
        } else {
          taskStates.push({
            task_run_id: this.taskRun.id,
            version: this.taskRun.version,
            state: { type: 'Pending', message: this.message }
          })
        }

        const result = await this.$apollo.mutate({
          mutation: require('@/graphql/TaskRun/set-task-run-states.gql'),
          variables: {
            input: taskStates
          }
        })

        if (result?.data?.set_task_run_states) {
          const { data } = await this.$apollo.mutate({
            mutation: require('@/graphql/TaskRun/set-flow-run-states.gql'),
            variables: {
              flowRunId: this.flowRunId,
              version: this.taskRun.flow_run.version,
              state: { type: 'Scheduled', message: this.message }
            }
          })

          if (!data?.set_flow_run_states) this.tasksSuccess = false
        }
      } catch (error) {
        this.tasksSuccess = false
        throw error
      } finally {
        this.setAlert({
          alertShow: true,
          alertMessage: this.tasksSuccess
            ? `Flow run ${
                this.taskRun.flow_run.name
              } restarted. This will ${this.runOrReRunMessage(oldState)}`
            : 'Sorry, we hit a problem trying to restart the run; please try again.',
          alertType: this.tasksSuccess ? 'success' : 'error'
        })
      }
    },
    async writeLogs() {
      const { data } = await this.$apollo.mutate({
        mutation: require('@/graphql/Update/write-run-logs.gql'),
        variables: {
          flowRunId: this.flowRunId,
          name: this.name,
          message: this.message
        }
      })
      return data?.write_run_logs?.success
    },
    onIntersect([entry]) {
      this.$apollo.queries.utilityDownstreamTasks.skip = !entry.isIntersecting
    }
  },
  apollo: {
    utilityDownstreamTasks: {
      query: require('@/graphql/TaskRun/utility_downstream_tasks.gql'),
      variables() {
        return {
          taskIds: `{${this.taskRun.task.id}}`,
          flowRunId: this.flowRunId
        }
      },
      pollInterval: 5000,
      update: data => data.utility_downstream_tasks
    }
  }
}
</script>

<template>
  <v-card v-intersect="{ handler: onIntersect }" tile>
    <v-card-title>
      Restart from failed?
    </v-card-title>

    <v-card-text v-if="raiseWarning()">
      <div class="font-weight-bold black--text">
        Warning: This flow has upstream dependencies which have not been cached.
        If you restart the flow-run from here, it is unlikely to succeed.
      </div>
      <div class="pb-5">
        For extra information, check out
        <router-link
          to="docs"
          target="_blank"
          href="https://docs.prefect.io/core/concepts/persistence.html#input-caching"
          >Persistence and Caching</router-link
        >
        in our docs.
      </div>
      <div>
        To restart the flow run {{ taskRun.flow_run.name }} from this task run
        anyway, click on confirm.
      </div>
    </v-card-text>
    <v-card-text v-else>
      Click on confirm to restart the flow run
      {{ taskRun.flow_run.name }} from this task run. This will restart your
      flow run and {{ runOrReRunMessage() }}.
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>

      <v-btn :disabled="permissionsCheck" color="primary" @click="restart">
        Confirm
      </v-btn>

      <v-btn text @click="cancel">
        Cancel
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
