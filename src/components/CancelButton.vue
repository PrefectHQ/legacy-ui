<script>
import { changeStateMixin } from '@/mixins/changeStateMixin'
import { mapGetters } from 'vuex'

export default {
  mixins: [changeStateMixin],
  computed: {
    ...mapGetters('license', ['hasPermission']),
    permissionsCheck() {
      return !this.hasPermission('update', 'run')
    }
  }
}
</script>

<template>
  <div v-if="dialogType == 'flow run'">
    <v-tooltip bottom>
      <template #activator="{ on }">
        <div v-on="on">
          <v-btn
            color="red darken-3"
            class="vertical-button white--text"
            :style="{ height: '46px' }"
            :disabled="!checkVersion || permissionsCheck || isFinishing"
            text
            small
            depressed
            :loading="cancelLoad"
            @click="cancelFlowRun"
          >
            <v-icon>not_interested</v-icon>
            Cancel
          </v-btn>
        </div>
      </template>
      <span v-if="permissionsCheck">
        You don't have permission to modify runs.
      </span>
      <span v-else-if="!checkVersion">
        Your Flow was registered with version {{ flowRun.flow.core_version }} of
        Prefect Core; please upgrade to version 0.13.0 or higher and re-register
        your Flow to enable cancellation.
      </span>
      <span v-else-if="isFinishing"
        >This flow run has concluded so it can't be cancelled.</span
      >
      <span v-else>Cancel this flow run.</span>
    </v-tooltip>
  </div>
</template>
