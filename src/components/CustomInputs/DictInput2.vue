<template>
  <div>
    <div v-for="entry in internalValue" :key="entry.key">
      {{ entry.key }} - {{ entry.value }}
    </div>
  </div>
</template>

<script>
import { formatJson, parseJson } from '@/utils/jsonUtility'

export default {
  props: {
    value: {
      type: [String, Object],
      required: false,
      default: null
    }
  },
  computed: {
    internalValue: {
      get() {
        return this.convertValueToArray(this.value)
      },
      set(value) {
        this.$emit('input', this.convertArrayToEmit(value))
      }
    }
  },
  methods: {
    convertValueToArray(value) {
      if (value == null) {
        return []
      }

      if (typeof value === 'string') {
        const objectOrArrayOrNull = parseJson(value)
        return this.convertValueToArray(objectOrArrayOrNull)
      }

      if (Array.isArray(value)) {
        return value
      }

      return Object.entries(value).map(([key, value]) => ({
        key,
        value
      }))
    },
    convertArrayToEmit() {
      if (typeof this.value === 'string') {
        return formatJson(this.internalValue)
      }

      if (Array.isArray(this.value)) {
        return this.internalValue
      }

      return this.internalValue.reduce(
        (obj, entry) => ({ ...obj, [entry.key]: entry.value }),
        {}
      )
    }
  }
}
</script>
