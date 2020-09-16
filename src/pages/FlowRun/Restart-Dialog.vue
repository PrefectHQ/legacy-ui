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
      return (
        this.flowRun.state == 'Failed' ||
        this.hasFailedTaskRuns ||
        this.flowRun.state === 'Cancelled' ||
        this.flowRun.state === 'Cancelling'
      )
    },
    hasFailedTaskRuns() {
      return this.failedTaskRuns?.length > 0
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    cancel() {
      this.$emit('cancel')
    },
    async restart() {
      try {
        this.cancel()

        this.writeLogs()

        // we want to avoid resetting the parent Mapped state of a mapped pipeline,
        // as that would cause *all* children to rerun, regardless of whether they failed.
        // So, first we collect all candidate run states and then filter:
        // if map_index is null, we can proceed normally - if not null, we explicitly
        // check whether it's one of the failed states
        let failedRunIds = this.failedTaskRuns.map(run => run.id)

        const taskRunStates = this.utilityDownstreamTasks
          .map(task =>
            task.task.task_runs.map(run => {
              if (!run.map_index || failedRunIds.includes(run.id)) {
                return {
                  version: run.version,
                  task_run_id: run.id,
                  state: { type: 'Pending', message: this.restartMessage }
                }
              }
            })
          )
          .flat()
          // the above flat map doesn't always return objects
          // but can return something like [undefined, {...}, undefined]
          // so we filter falsey values here
          .filter(x => !!x)

        let result
        if (taskRunStates?.length > 0) {
          result = await this.$apollo.mutate({
            mutation: require('@/graphql/TaskRun/set-task-run-states.gql'),
            variables: {
              input: taskRunStates
            }
          })
        }

        if (
          result?.data?.set_task_run_states ||
          this.flowRun.state == 'Failed' ||
          this.flowRun.state === 'Cancelled' ||
          this.flowRun.state == 'Cancelling'
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
      update: data => data?.task_run
    },
    utilityDownstreamTasks: {
      query: require('@/graphql/TaskRun/utility_downstream_tasks.gql'),
      variables() {
        return {
          // the start_task_ids argument requires a postgres literal,
          // which is why these are interpolated between {} brackets
          taskIds: `{${this.failedTaskRuns
            .map(task => task.task_id)
            .join(',')}}`,
          flowRunId: this.flowRun.id
        }
      },
      skip() {
        return !this.failedTaskRuns
      },
      update: data => data.utility_downstream_tasks
    }
  }
}
</script>

<template>
  <v-card tile>
    <v-card-title> Restart from {{ flowRun.state }}? </v-card-title>

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
          You can only restart a failed flow run.
        </span>
      </v-tooltip>

      <v-btn text @click="cancel">
        Cancel
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
