<script>
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'
import FlowName from '@/pages/Calendar/FlowName'
import ExternalLink from '@/components/ExternalLink'
import { mapGetters } from 'vuex'

export default {
  components: {
    DurationSpan,
    FlowName,
    ExternalLink
  },
  mixins: [formatTime],
  props: {
    run: { type: Object, required: false, default: () => {} },
    type: { type: String, required: false, default: 'task-run' },
    active: { type: Boolean, required: true }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    showScheduleBanner() {
      return this.run.state === 'Scheduled' && this.active && this.isCloud
    }
  },
  methods: {
    statusStyle(state) {
      return {
        'border-radius': '50%',
        display: 'inline-block',
        'background-color': `var(--v-${state}-base)`,
        height: '1rem',
        width: '1rem'
      }
    }
  },
  apollo: {}
}
</script>

<template>
  <v-card tile class="pointer">
    <v-alert
      v-if="showScheduleBanner"
      class="mx-2 mt-2 mb-0 text-caption radius"
      type="warning"
      icon="announcement"
      dense
    >
      Reminder!
      <ExternalLink
        href="https://docs.prefect.io/orchestration/concepts/services.html#scheduler"
      >
        The Prefect Scheduler
      </ExternalLink>
      will only schedule 10 runs in advance.
    </v-alert>
    <v-card-title class="text-subtitle-1 pt-2">
      <router-link :to="{ name: type, params: { id: run.id } }" target="_blank">
        {{ run.name ? run.name : run.task_name }}
        {{ run.map_index > -1 ? `(${run.map_index})` : '' }}
      </router-link>
      <v-icon x-small>
        open_in_new
      </v-icon>
    </v-card-title>
    <v-card-subtitle v-if="type === 'flow-run'">
      <FlowName :id="run.flow_id" left :truncate="false" />
    </v-card-subtitle>
    <v-card-text>
      <div>
        State:
        <span :style="statusStyle(run.state)"></span>
        <span class="font-weight-bold"> {{ run.state }}</span>
      </div>
      <div v-if="run.start_time" class="subtitle">
        Duration:
        <DurationSpan
          class="font-weight-bold"
          :start-time="run.start_time"
          :end-time="run.end_time"
        />
      </div>
      <div v-if="run.start_time" class="subtitle">
        Start:
        <span class="font-weight-bold">
          {{ formatTime(run.start_time) }}
        </span>
      </div>
      <div v-if="run.end_time" class="subtitle ">
        End:
        <span class="font-weight-bold">
          {{ formatTime(run.end_time) }}
        </span>
      </div>
      <div v-if="run.state_timestamp" class="subtitle">
        Updated:
        <span class="font-weight-bold">
          {{ formatTime(run.state_timestamp) }}
        </span>
      </div>

      <div v-if="run.max_retries" class="subtitle">
        Max Retries:
        <span class="font-weight-bold">
          {{ run.max_retries || 0 }}
        </span>
      </div>
      <div v-if="run.retry_delay" class="subtitle">
        Retry delay:
        <span class="font-weight-bold">
          {{ run.retry_delay || 0 }}
        </span>
      </div>
      <v-divider v-if="run.state_message" class="my-2" />
      <div v-if="run.state_message">
        <div class="text-subtitle">Message:</div>
        <div class="font-weight-bold">
          {{ run.state_message || 'No message' }}
        </div>
      </div>
      <v-divider v-if="run.state_result" class="my-2" />
      <div v-if="run.state_result" class="text-subtitle-1">
        <div>Result:</div>
        <div class="font-weight-bold">
          {{ run.state_result || 'No result' }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.pointer {
  cursor: default;
}

.v-card > .radius {
  border-radius: 4px !important;
}
</style>
