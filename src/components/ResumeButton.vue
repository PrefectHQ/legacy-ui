<script>
import { changeStateMixin } from '@/mixins/changeStateMixin'
import { mapGetters } from 'vuex'

export default {
  mixins: [changeStateMixin],
  props: {
    includeText: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  computed: {
    ...mapGetters('license', ['hasPermission']),
    permissionsCheck() {
      return !this.hasPermission('update', 'run')
    },
    loading() {
      if (this.resumeLoad == this.taskRun.id) return true
      if (this.taskRunApproved && this.taskRun.state === 'Paused') return true
      return false
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
          :disabled="permissionsCheck"
          color="accentOrange"
          :loading="loading"
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
