<script>
import DurationSpan from '@/components/DurationSpan'
import { calculateDuration } from '@/utils/states'
export default {
  components: { DurationSpan },
  props: {
    data: { type: Object, required: true }
  },
  computed: {
    isParameter() {
      return this.data?.type?.split('.').pop() == 'Parameter'
    }
  },
  methods: {
    calculateDuration
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

        <div v-if="data.start_time" class="subtitle">
          Duration:
          <DurationSpan
            :start-time="data.start_time"
            :end-time="
              calculateDuration(data.start_time, data.end_time, data.state)
            "
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
