<script>
import { changeStateMixin } from '@/mixins/changeStateMixin'

export default {
  mixins: [changeStateMixin]
}
</script>

<template>
  <div v-if="dialogType == 'flow run'">
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <div v-on="on">
          <v-btn
            color="red darken-3"
            class="vertical-button white--text"
            :style="{ height: '46px' }"
            :disabled="
              !checkVersion ||
                role === 'READ_ONLY_USER' ||
                flowRun.state !== 'Running'
            "
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
      <span v-if="role === 'READ_ONLY_USER'">
        Read-only users can't cancel flows.
      </span>
      <span v-else-if="!checkVersion">
        Your Flow was registered with version {{ flowRun.flow.core_version }} of
        Prefect Core; please upgrade to version 0.13.0 or higher and re-register
        your Flow to enable cancellation.
      </span>
      <span v-else-if="flowRun.state !== 'Running'">
        You can't cancel a flow that's not running
      </span>
      <span v-else>Cancel a flow run</span>
    </v-tooltip>
  </div>
</template>
