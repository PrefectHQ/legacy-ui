<script>
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    DurationSpan
  },
  mixins: [formatTime],
  props: {
    taskRuns: { type: Array, required: true }
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
  }
}
</script>

<template>
  <div class="v-tooltip__content">
    <div v-for="(taskRun, i) in taskRuns" :key="i">
      <h3>{{ taskRun.task_name }}</h3>

      <div class="d-flex align-center justify-start">
        <div :style="statusStyle(taskRun.state)"></div>
        <div class="ml-2">{{ taskRun.state }}</div>
      </div>

      <div v-if="taskRun.state == 'Scheduled'" class="subtitle">
        Scheduled for:
        <span class="font-weight-black">
          {{ logTimeExtended(taskRun.scheduled_start_time) }}
        </span>
      </div>

      <div v-if="taskRun.start_time" class="subtitle">
        Started:
        <span class="font-weight-black">
          {{ logTimeExtended(taskRun.start_time) }}
        </span>
      </div>

      <div v-if="taskRun.end_time" class="subtitle">
        Ended:
        <span class="font-weight-black">
          {{ logTimeExtended(taskRun.end_time) }}
        </span>
      </div>

      <div v-if="taskRun.start_time" class="subtitle">
        Duration:
        <DurationSpan
          class="font-weight-bold"
          :start-time="taskRun.start_time"
          :end-time="taskRun.end_time"
        />
      </div>
    </div>
  </div>
</template>
