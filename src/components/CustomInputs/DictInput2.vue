<template>
  <div>
    <div v-for="entry in internalValue" :key="entry.key">
      {{ entry.key }} - {{ entry.value }}
    </div>
  </div>
</template>

<script>
import { convertValueToArray, convertArrayToTargetType } from '@/utils/array'

export default {
  props: {
    value: {
      type: [String, Object, Array],
      required: false,
      default: null
    }
  },
  computed: {
    internalValue: {
      get() {
        return convertValueToArray(this.value)
      },
      set(value) {
        this.$emit('input', convertArrayToTargetType(value, this.value))
      }
    }
  }
}
</script>
