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
    taskRuns: { type: Array, required: true }
  },
  computed: {
    displayedTaskRuns() {
      return this.taskRuns.slice(0, 5)
    },
    hiddenTaskRuns() {
      return this.taskRuns.slice(5)
    }
  },
  methods: {
    expectedRuns(taskRun) {
      return (
        taskRun.data?.serialized_state?.n_map_states || 'Unknown'
      ).toLocaleString()
    },
    stateClass(state) {
      const lightStates = [
        'Submitted',
        'Cancelled',
        'Cancelling',
        'Queued',
        'Pending'
      ]

      const textColor = lightStates.includes(state)
        ? ['grey--text', 'text--darken-4']
        : ['white--text']

      return [state, ...textColor]
    },
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
  <div class="v-tooltip__content tooltip py-2">
    <div v-for="(taskRun, i) in displayedTaskRuns" :key="i">
      <div class="text-h6">{{ taskRun.data.task_name }}</div>

      <div class="d-flex align-center justify-start">
        <div :style="statusStyle(taskRun.data.state)"></div>
        <div class="ml-2">{{ taskRun.data.state }}</div>
      </div>

      <div v-if="taskRun.state == 'Scheduled'" class="text-subtitle-1">
        Scheduled for:
        <span class="font-weight-black">
          {{ logTimeExtended(taskRun.data.scheduled_start_time) }}
        </span>
      </div>

      <div v-if="taskRun.start_time" class="text-subtitle-1">
        Started:
        <span class="font-weight-black">
          {{ logTimeExtended(taskRun.start_time) }}
        </span>
      </div>

      <div v-if="taskRun.end_time" class="text-subtitle-1">
        Ended:
        <span class="font-weight-black">
          {{ logTimeExtended(taskRun.end_time) }}
        </span>
      </div>

      <div v-if="taskRun.start_time" class="text-subtitle-1">
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
        v-if="taskRun.data.serialized_state.n_map_states"
        class="divider"
      ></div>

      <div v-if="taskRun.data.state == 'Mapped'" class="text-subtitle-1">
        Expected Runs:
        <span class="font-weight-black">
          {{ expectedRuns(taskRun) }}
        </span>
      </div>

      <div v-if="taskRun.data.mappedChildren">
        <div>
          <div class="text-subtitle-1">Mapped Runs</div>

          <v-chip
            v-for="state in Object.keys(
              taskRun.data.mappedChildren.state_counts
            )"
            :key="state"
            class="px-4 font-weight-medium mr-1"
            :class="stateClass(state)"
            label
            small
          >
            {{ state }}
            <span class="font-weight-normal ml-1">
              ({{
                taskRun.data.mappedChildren.state_counts[
                  state
                ].toLocaleString()
              }})
            </span>
          </v-chip>
        </div>
      </div>

      <div
        v-if="
          displayedTaskRuns.length > 1 && i !== displayedTaskRuns.length - 1
        "
        class="divider"
      ></div>
    </div>

    <div
      v-if="hiddenTaskRuns.length"
      class="pt-4 text-caption font-weight-medium text-right"
    >
      +{{ hiddenTaskRuns.length }} more
    </div>
  </div>
</template>

<style lang="scss" scoped>
.divider {
  border: 1px solid;
  margin: 8px 0;
}

.tooltip {
  height: auto;
  width: 100%;
}
</style>
