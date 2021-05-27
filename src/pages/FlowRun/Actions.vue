<script>
import { mapGetters, mapActions } from 'vuex'
import { FINISHED_STATES } from '@/utils/states'

// We're removing this until the stack functionality
// is in a more tenable place.
import CancelButton from '@/components/CancelButton.vue'
import SetStateDialog from '@/components/SetStateDialog.vue'
import RestartDialog from '@/pages/FlowRun/Restart-Dialog'

export default {
  components: { CancelButton, RestartDialog, SetStateDialog },
  props: {
    flowRun: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      runFlowNowClicked: false,
      runFlowNowLoading: false,

      // Alert
      alertMessage: '',
      alertType: 'info',

      //restart
      eligibleStates: ['Failed', 'Cancelled'],
      eligibleTaskRunStates: [
        'Cancelled',
        'Failed',
        'TimedOut',
        'TriggerFailed'
      ],
      restartDialog: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('license', ['hasPermission']),
    isReadOnlyUser() {
      return (
        !this.hasPermission('create', 'role') &&
        !this.hasPermission('create', 'run')
      )
    },
    isScheduled() {
      return this.flowRun?.state === 'Scheduled'
    },
    isFinished() {
      return FINISHED_STATES.includes(this.flowRun.state)
    },
    canRestart() {
      return (
        !this.flowRun.flow.archived &&
        (this.failedTaskRuns?.length > 0 ||
          this.eligibleStates.includes(this.flowRun.state))
      )
    }
  },
  watch: {
    flowRun(newVal, oldVal) {
      if (oldVal.state === 'Scheduled' && newVal.state !== 'Scheduled') {
        this.isRunningNow = false
      }
      if (
        newVal.state !== oldVal.state &&
        FINISHED_STATES.includes(newVal.state)
      ) {
        this.$apollo.queries.failedTaskRuns.refetch()
      }
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    deleteFlowRun() {},
    handleRestartClick() {
      this.$apollo.queries.failedTaskRuns.refetch()
      this.restartDialog = true
    },
    async runFlowNow() {
      this.runFlowNowLoading = true

      try {
        this.runFlowNowClicked = true
        // Set the flow in a Scheduled state (even if it's already Scheduled).
        // This causes the flow run to execute immediately.
        await this.$apollo.mutate({
          mutation: require('@/graphql/TaskRun/set-flow-run-states.gql'),
          variables: {
            flowRunId: this.flowRun.id,
            version: this.flowRun.version,
            state: {
              type: 'Scheduled'
            }
          }
        })

        this.alertMessage =
          'Your flow run has been scheduled to start immediately.'
        this.alertType = 'success'
      } catch (error) {
        this.alertMessage =
          'Something went wrong while trying to run this flow. Please try again later.'
        this.alertType = 'error'
        this.runFlowNowClicked = false
        throw error
      }

      this.runFlowNowLoading = false

      this.setAlert({
        alertShow: true,
        alertMessage: this.alertMessage,
        alertType: this.alertType
      })
    }
  },
  apollo: {
    failedTaskRuns: {
      query: require('@/graphql/FlowRun/failed-task-runs.gql'),
      variables() {
        return {
          flowRunId: this.flowRun.id,
          failedStates: this.eligibleTaskRunStates
        }
      },
      update: data => data?.task_run
    }
  }
}
</script>

<template>
  <div
    class="pa-0 mb-2 d-flex align-center"
    :class="[
      $vuetify.breakpoint.xsOnly ? 'justify-center' : 'justify-end',
      $vuetify.breakpoint.xsOnly && 'mx-auto'
    ]"
  >
    <v-tooltip v-if="isScheduled" bottom>
      <template #activator="{ on }">
        <div v-on="on">
          <v-btn
            class="vertical-button"
            style="height: 46px;"
            color="primary"
            text
            depressed
            :loading="runFlowNowLoading"
            :disabled="runFlowNowLoading || runFlowNowClicked || isReadOnlyUser"
            small
            @click="runFlowNow"
          >
            <v-icon>fa-rocket</v-icon>
            <div>Start Now</div>
          </v-btn>
        </div>
      </template>
      <span v-if="isReadOnlyUser">
        Read-only users cannot run flows
      </span>
      <span v-else-if="runFlowNowClicked">
        This flow run has been scheduled to start as soon as possible.
      </span>
      <span v-else>
        Start this flow run immediately
      </span>
    </v-tooltip>

    <v-tooltip max-width="250px" bottom>
      <template #activator="{ on }">
        <div v-on="on">
          <v-btn
            class="vertical-button"
            text
            depressed
            style="height: 46px;"
            small
            :disabled="isReadOnlyUser || !canRestart"
            color="info"
            @click="handleRestartClick"
          >
            <v-icon>fab fa-rev</v-icon>
            <div>Restart</div>
          </v-btn>
        </div>
      </template>
      <span v-if="isReadOnlyUser">
        Read-only users cannot restart flow runs
      </span>
      <span v-else-if="!canRestart"
        >You can only restart non-archived flow runs from a failed or cancelled
        state.
        <span v-if="isFinished"
          >If you wish to run this flow run again, you can set it (and its task
          runs) into a scheduled state.</span
        >
      </span>
      <span v-else>Restart run from {{ flowRun.state }} </span>
    </v-tooltip>

    <v-dialog v-model="restartDialog" width="500">
      <RestartDialog
        :flow-run="flowRun"
        :failed-task-runs="failedTaskRuns"
        :eligible-states="eligibleStates"
        @cancel="restartDialog = false"
      />
    </v-dialog>

    <SetStateDialog dialog-type="flow run" :flow-run="flowRun" />

    <CancelButton dialog-type="flow run" :flow-run="flowRun" />

    <v-tooltip bottom>
      <template #activator="{ on }">
        <div v-on="on">
          <v-btn
            v-if="
              tenant.prefectAdminSettings &&
                tenant.prefectAdminSettings.deleteFlow
            "
            class="vertical-button py-1"
            text
            tile
            disabled
            small
            color="red"
            @click="deleteFlowRun"
          >
            <v-icon>delete</v-icon>
            <div class="mb-1">Delete</div>
          </v-btn>
        </div>
      </template>
      <span v-if="isReadOnlyUser">
        Read-only users cannot delete flows
      </span>
      <span v-else>Coming Soon!</span>
    </v-tooltip>
  </div>
</template>
