<script>
import DurationSpan from '@/components/DurationSpan'

export default {
  components: {
    DurationSpan
  },
  props: {
    tooltip: { type: Object, required: true }
  }
}
</script>

<template functional>
  <div>
    <div v-if="props.tooltip.data.flow" class="title truncate">
      {{ props.tooltip.data.flow.name }}
    </div>
    <div
      class="truncate"
      :class="props.tooltip.data.flow ? 'caption' : 'title'"
    >
      {{ props.tooltip.data.name }}
    </div>

    <div class="d-flex align-center justify-start">
      <div :style="props.tooltip.status_style"></div>
      <div class="ml-2">{{ props.tooltip.data.state }}</div>
    </div>

    <div class="divider"></div>

    <div v-if="props.tooltip.data.state == 'Scheduled'" class="subtitle">
      Scheduled for:
      <span class="font-weight-black">
        {{ props.tooltip.data.display_scheduled_start_time }}
      </span>
    </div>

    <div v-if="props.tooltip.data.start_time" class="subtitle">
      Started:
      <span class="font-weight-black">
        {{ props.tooltip.data.display_start_time }}
      </span>
    </div>

    <div v-if="props.tooltip.data.end_time" class="subtitle">
      Ended:
      <span class="font-weight-black">
        {{ props.tooltip.data.display_end_time }}
      </span>
    </div>

    <div
      v-if="props.tooltip.data.duration || props.tooltip.data.start_time"
      class="subtitle"
    >
      Duration:
      <span
        v-if="props.tooltip.data.state !== 'Running'"
        class="font-weight-black"
      >
        {{ props.tooltip.data.duration | duration }}
      </span>
      <component
        :is="$options.components.DurationSpan"
        v-else-if="props.tooltip.data.start_time"
        class="font-weight-bold"
        :start-time="props.tooltip.data.start_time"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.divider {
  border: 1px solid #fff;
  margin: 8px 0;
}
</style>
