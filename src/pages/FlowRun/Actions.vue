<script>
import { mapGetters, mapActions } from 'vuex'

// We're removing this until the stack functionality
// is in a more tenable place.
import CancelButton from '@/components/CancelButton.vue'
import MarkAsDialog from '@/components/MarkAsDialog.vue'
import RestartDialog from '@/pages/FlowRun/Restart-Dialog'

export default {
  components: { CancelButton, RestartDialog, MarkAsDialog },
  props: {
    flowRun: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      isRunningNow: false,
      restartDialog: false,

      // Alert
      showAlert: false,
      alertMessage: '',
      alertType: 'info'
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role']),
    isReadOnlyUser() {
      return this.role === 'READ_ONLY_USER'
    },
    isScheduled() {
      return this.flowRun?.state === 'Scheduled'
    }
  },
  watch: {
    flowRun(newVal, oldVal) {
      if (oldVal.state === 'Scheduled' && newVal.state !== 'Scheduled') {
        this.isRunningNow = false
      }
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    deleteFlowRun() {},
    async runFlowNow() {
      try {
        this.isRunningNow = true

        // Set the flow in a Scheduled state (even if it's already Scheduled).
        // This causes the flow run to execute immediately.
        await this.$apollo.mutate({
          mutation: require('@/graphql/TaskRun/set-flow-run-states.gql'),
          variables: {
            flow_run_id: this.flowRun.id,
            version: this.flowRun.version,
            state: {
              type: 'Scheduled'
            }
          }
        })

        this.alertMessage =
          'Your flow run has been scheduled to start immediately.'
        this.alertType = 'success'
        this.showAlert = true
      } catch (error) {
        this.alertMessage =
          'Something went wrong while trying to run this flow. Please try again later.'
        this.alertType = 'error'
        this.showAlert = true
        this.isRunningNow = false
        throw error
      }

      this.setError({
        alertShow: this.alertShow,
        alertMessage: this.alertMessage,
        alertType: this.alertType
      })
    }
  }
}
</script>

<template>
  <div
    class="pa-0 mb-2 d-flex align-center"
    :class="$vuetify.breakpoint.smAndDown ? 'justify-center' : 'justify-end'"
  >
    <v-tooltip v-if="isScheduled" bottom>
      <template v-slot:activator="{ on }">
        <div v-on="on">
          <v-btn
            class="vertical-button"
            :style="{ height: '46px' }"
            color="primary"
            text
            depressed
            :loading="isRunningNow"
            :disabled="isRunningNow || !isScheduled || isReadOnlyUser"
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
      <span v-else>
        Start this flow run immediately
      </span>
    </v-tooltip>

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <div v-on="on">
          <v-btn
            class="vertical-button"
            :style="{ height: '46px' }"
            text
            depressed
            small
            :disabled="isReadOnlyUser"
            color="deep-orange darken-1"
            @click="restartDialog = true"
          >
            <v-icon>fab fa-rev</v-icon>
            <div>Restart</div>
          </v-btn>
        </div>
      </template>
      <span v-if="isReadOnlyUser">
        Read-only users cannot restart flow runs
      </span>
      <span v-else>Restart run from failed</span>
    </v-tooltip>

    <v-dialog v-model="restartDialog" width="500">
      <RestartDialog :flow-run="flowRun" @cancel="restartDialog = false" />
    </v-dialog>

    <MarkAsDialog dialog-type="flow run" :flow-run="flowRun" />

    <CancelButton dialog-type="flow run" :flow-run="flowRun" />

    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
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

<style lang="scss">
.vertical-divider {
  border-left: 0.5px solid rgba(0, 0, 0, 0.26);
  border-right: 0.5px solid rgba(0, 0, 0, 0.26);
  height: 75%;
}
</style>
