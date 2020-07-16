<script>
import { changeStateMixin } from '@/mixins/changeStateMixin'

export default {
  mixins: [changeStateMixin],
  props: {
    includeText: {
      type: Boolean,
      required: false,
      default: false
    }
  }
}
</script>

<template>
  <v-tooltip bottom>
    <template #activator="{ on: tooltip }">
      <div v-on="{ ...tooltip }">
        <v-btn
          class="vertical-button mr-2"
          :style="{ height: '46px' }"
          data-cy="resume"
          text
          depressed
          small
          :disabled="role === 'READ_ONLY_USER'"
          color="accentOrange"
          :loading="resumeLoad == taskRun.id"
          @click="resumeRun"
        >
          <v-icon>far fa-check-circle</v-icon>
          <span v-if="includeText"> Approve </span>
        </v-btn>
      </div>
    </template>
    <span>Approve task run (allows the task run to resume)</span>
  </v-tooltip>
</template>
