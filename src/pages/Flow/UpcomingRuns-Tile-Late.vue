<script>
import { formatTime } from '@/mixins/formatTimeMixin'
import LabelWarning from '@/components/LabelWarning'
import DurationSpan from '@/components/DurationSpan'

export default {
  components: {
    LabelWarning,
    DurationSpan
  },
  mixins: [formatTime],
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    runs: {
      type: Array,
      required: true
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
          Everything is running on schedule!
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
        min-height="40px"
        transition="fade"
      >
        <v-list-item dense two-line>
          <v-list-item-content>
            <v-list-item-subtitle class="text-body-1 font-weight-regular">
              <router-link :to="{ name: 'flow-run', params: { id: run.id } }">
                {{ run.name }}
              </router-link>
            </v-list-item-subtitle>

            <span class="text-caption mb-0 ml-n1 d-flex align-center">
              <LabelWarning :flow-run="run" location="flowPage" />
              <span class="ml-1">
                Scheduled for
                {{ formatDateTime(run.scheduled_start_time) }}
              </span>
            </span>

            <v-list-item-subtitle class="text-caption">
              <DurationSpan :start-time="run.scheduled_start_time" />
              behind schedule
            </v-list-item-subtitle>
          </v-list-item-content>
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
