<script>
import { formatTime } from '@/mixins/formatTimeMixin.js'
export default {
  mixins: [formatTime],
  props: {
    index: {
      type: Number,
      required: true
    },
    source: {
      type: Object,
      default() {
        return {}
      }
    }
  }
}
</script>

<template>
  <div class="text-truncate">
    <span class="text-caption text--disabled">
      {{ index }} {{ formatDateTime(source.timestamp) }}
    </span>
    {{ source.message }}
  </div>
</template>

<style lang="scss" scoped>
/* */
</style>
