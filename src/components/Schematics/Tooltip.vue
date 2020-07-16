<script>
import DurationSpan from '@/components/DurationSpan'
export default {
  components: { DurationSpan },
  props: {
    data: { type: Object, required: true }
  },
  computed: {
    isParameter() {
      return this.data?.type?.split('.').pop() == 'Parameter'
    }
  }
}
</script>

<template>
  <transition name="tooltip-fade" mode="in-out">
    <span class="schematic-tooltip v-tooltip__content">
      <div>
        <span class="accentOrange--text">
          {{ isParameter ? '[Parameter]' : '' }}
        </span>
        <span class="font-weight-bold">{{ data.name }}</span>

        <div v-if="data.duration || data.start_time" class="subtitle">
          Duration:
          <span v-if="data.duration" class="font-weight-black">
            {{ data.duration | duration }}
          </span>
          <DurationSpan
            v-else-if="data.start_time"
            :start-time="data.start_time"
          />
        </div>
      </div>
    </span>
  </transition>
</template>

<style lang="scss" scoped>
.schematic-tooltip {
  pointer-events: none;
  position: absolute;
  text-overflow: initial;
  transform-origin: bottom;
  user-select: none;
  width: fit-content !important;
  z-index: 1;
}
</style>
