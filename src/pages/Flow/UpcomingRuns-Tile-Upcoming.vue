<script>
import { runFlowNowMixin } from '@/mixins/runFlowNow'
import { formatTime } from '@/mixins/formatTimeMixin'
import LabelWarning from '@/components/LabelWarning'

export default {
  components: {
    LabelWarning
  },
  mixins: [runFlowNowMixin, formatTime],
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    runs: {
      type: Array,
      default: () => []
    }
  }
}
</script>

<template>
  <v-card-text class="pa-0 card-content">
    <v-skeleton-loader v-if="loading" type="list-item-three-line" />

    <v-list-item v-else-if="runs.length === 0" dense>
      <v-list-item-avatar class="mr-0">
        <v-icon class="green--text">check</v-icon>
      </v-list-item-avatar>
      <v-list-item-content class="my-0 py-0">
        <div
          class="text-subtitle-1 font-weight-light"
          style="line-height: 1.25rem;"
        >
          No upcoming runs.
        </div>
      </v-list-item-content>
    </v-list-item>

    <v-list v-else dense class="card-content">
      <v-lazy
        v-for="run in runs"
        :key="run.id"
        :options="{
          threshold: 0.75
        }"
        min-height="44"
        transition="fade-transition"
      >
        <v-list-item dense :disabled="setToRun.includes(run.id)">
          <v-list-item-content>
            <v-list-item-subtitle class="text-body-1 font-weight-regular">
              <router-link :to="{ name: 'flow-run', params: { id: run.id } }">
                {{ run.name }}
              </router-link>
            </v-list-item-subtitle>

            <span class="text-caption mb-0 ml-n1 d-flex align-center">
              <LabelWarning :flow="run.flow" :flow-run="run" />
              <span class="ml-1">
                Scheduled for
                {{ formatDateTime(run.scheduled_start_time) }}
              </span>
            </span>
          </v-list-item-content>

          <v-list-item-action tile min-width="5" class="text-body-2">
            <v-tooltip top>
              <template #activator="{ on }">
                <v-btn
                  text
                  x-small
                  aria-label="Run Now"
                  :disabled="setToRun.includes(run.id)"
                  color="primary"
                  class="vertical-button"
                  v-on="on"
                  @click="runFlowNow(run.id, run.version, run.name)"
                >
                  <v-icon small dense color="primary">fa-rocket</v-icon>
                </v-btn>
              </template>
              <span> Run {{ run.name }} now </span>
            </v-tooltip>
          </v-list-item-action>
        </v-list-item>
      </v-lazy>
    </v-list>
  </v-card-text>
</template>

<style lang="scss" scoped>
a {
  text-decoration: none !important;
}

.card-content {
  height: 100%;
  max-height: 179px;
  overflow-y: auto;
  position: relative;
}
</style>
