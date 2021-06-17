<script>
import { mapGetters } from 'vuex'
// import CancelButton from '@/components/CancelButton.vue'
import SetStateDialog from '@/components/SetStateDialog.vue'
import RestartDialog from '@/pages/TaskRun/Restart-Dialog'
import ResumeButton from '@/components/ResumeButton'

export default {
  components: { RestartDialog, SetStateDialog, ResumeButton },
  props: {
    taskRun: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      restartDialog: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('license', ['hasPermission']),
    isReadOnly() {
      return !this.hasPermission('update', 'run')
    }
  },
  methods: {}
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
    <ResumeButton
      v-if="taskRun.state == 'Paused'"
      dialog-type="resume"
      :task-run="taskRun"
      :include-text="true"
    />
    <v-tooltip bottom>
      <template #activator="{ on }">
        <div v-on="on">
          <v-btn
            class="vertical-button mr-2"
            text
            depressed
            small
            :disabled="isReadOnly"
            color="primary"
            @click="restartDialog = true"
          >
            <v-icon>fab fa-rev</v-icon>
            <div>Restart</div>
          </v-btn>
        </div>
      </template>
      <span v-if="isReadOnly">
        You don't have permission to restart flow runs
      </span>
      <span v-else>Restart flow run from this task</span>
    </v-tooltip>

    <v-dialog v-model="restartDialog" width="500">
      <RestartDialog
        :task-run="taskRun"
        :flow-run-id="taskRun.flow_run.id"
        @cancel="restartDialog = false"
      />
    </v-dialog>

    <SetStateDialog dialog-type="task run" :task-run="taskRun" />

    <!-- Shouldn't we be able to cancel this? -->
    <!-- <CancelButton dialog-type="flow run" :flow-run="flowRun" /> -->
  </div>
</template>
