<script>
import DurationSpan from '@/components/DurationSpan'
import { calculateDuration } from '@/utils/states'

export default {
  components: {
    DurationSpan
  },
  props: {
    tooltip: { type: Object, required: true },
    loading: { type: Boolean, required: false, default: false },
    showProjectName: { type: Boolean, required: false, default: false }
  },
  methods: {
    calculateDuration
  }
}
</script>

<template functional>
  <div>
    <div v-if="props.tooltip.data.flow" class="text-h6 text-truncate">
      {{ props.tooltip.data.flow.name }}
    </div>
    <div v-else-if="props.loading">
      ...
    </div>
    <div
      class="text-truncate"
      :class="
        props.tooltip.data.flow || props.loading ? 'text-caption' : 'text-h6'
      "
    >
      {{ props.tooltip.data.name }}
    </div>

    <div class="d-flex align-center justify-start">
      <div :style="props.tooltip.status_style"></div>
      <div class="ml-2">{{ props.tooltip.data.state }}</div>
    </div>

    <div class="divider"></div>
    <div
      v-if="
        props.showProjectName &&
          !props.loading &&
          props.tooltip.data.flow.project.name
      "
      class="text-subtitle-1"
    >
      Project:
      <span class="font-weight-black">
        {{ props.tooltip.data.flow.project.name }}
      </span>
    </div>

    <div v-if="!props.tooltip.limited_view">
      <div
        v-if="props.tooltip.data.state == 'Scheduled'"
        class="text-subtitle-1"
      >
        Scheduled for:
        <span class="font-weight-black">
          {{ props.tooltip.data.display_scheduled_start_time }}
        </span>
      </div>

      <div v-if="props.tooltip.data.start_time" class="text-subtitle-1">
        Started:
        <span class="font-weight-black">
          {{ props.tooltip.data.display_start_time }}
        </span>
      </div>

      <div v-if="props.tooltip.data.end_time" class="text-subtitle-1">
        Ended:
        <span class="font-weight-black">
          {{ props.tooltip.data.display_end_time }}
        </span>
      </div>

      <div
        v-if="
          props.tooltip.data.start_time &&
            (props.tooltip.data.end_time || !props.tooltip.data.finished)
        "
        class="text-subtitle-1"
      >
        Duration:
        <component
          :is="$options.components.DurationSpan"
          class="font-weight-bold"
          :start-time="props.tooltip.data.start_time"
          :end-time="props.tooltip.data.end_time"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.divider {
  border: 1px solid;
  margin: 8px 0;
}
</style>
