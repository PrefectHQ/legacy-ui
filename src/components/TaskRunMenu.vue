<script>
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'
import { calculateDuration } from '@/utils/states'

export default {
  components: {
    DurationSpan
  },
  mixins: [formatTime],
  props: {
    taskRun: { type: Object, required: true }
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
    },
    calculateDuration
  }
}
</script>

<template>
  <v-card tile>
    <v-card-title class="text-subtitle-1">
      <router-link :to="{ name: 'task-run', params: { id: taskRun.id } }">
        {{ taskRun.name ? taskRun.name : taskRun.task_name }}
        {{ taskRun.map_index > -1 ? `(${taskRun.map_index})` : '' }}
      </router-link>
    </v-card-title>
    <v-card-text>
      <div>
        State:
        <span :style="statusStyle(taskRun.state)"></span>
        <span class="font-weight-bold"> {{ taskRun.state }}</span>
      </div>
      <div
        v-if="taskRun.start_time"
        class="subtitle d-flex align-end justify-space-between"
      >
        Duration:
        <DurationSpan
          class="font-weight-bold"
          :start-time="taskRun.start_time"
          :end-time="
            calculateDuration(
              taskRun.start_time,
              taskRun.end_time,
              taskRun.state
            )
          "
        />
      </div>
      <div
        v-if="taskRun.start_time"
        class="subtitle d-flex align-end justify-space-between"
      >
        Start:
        <span class="font-weight-bold">
          {{ formatTime(taskRun.start_time) }}
        </span>
      </div>
      <div
        v-if="taskRun.end_time"
        class="subtitle d-flex align-end justify-space-between"
      >
        End:
        <span class="font-weight-bold">
          {{ formatTime(taskRun.end_time) }}
        </span>
      </div>
      <div
        v-if="taskRun.state_timestamp"
        class="subtitle d-flex align-end justify-space-between"
      >
        Updated:
        <span class="font-weight-bold">
          {{ formatTime(taskRun.state_timestamp) }}
        </span>
      </div>
      <div class="subtitle d-flex align-end justify-space-between">
        Max Retries:
        <span class="font-weight-bold">
          {{ taskRun.max_retries || 0 }}
        </span>
      </div>
      <div class="subtitle d-flex align-end justify-space-between">
        Retry delay:
        <span class="font-weight-bold">
          {{ taskRun.retry_delay || 0 }}
        </span>
      </div>
      <v-divider class="my-2" />
      <div class="text-subtitle-1">
        <div>Message:</div>
        <div class="font-weight-bold">
          {{ taskRun.state_message || 'No message' }}
        </div>
      </div>
      <v-divider class="my-2" />
      <div class="text-subtitle-1">
        <div>Result:</div>
        <div class="font-weight-bold">
          {{ taskRun.state_result || 'No result' }}
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
