<template>
  <v-text-field
    v-model="internalValue"
    :error-messages="errors"
    :disabled="disabled"
    v-bind="{ label: 'Value', outlined: true, dense: true }"
  />
</template>

<script>
import { isValidJson, parseJson, formatJson } from '@/utils/json'

export default {
  name: 'ArrayInput',
  props: {
    value: {
      type: [String, Number, Boolean, Object, Array],
      required: false,
      default: null
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      errors: []
    }
  },
  computed: {
    internalValue: {
      get() {
        return formatJson(this.value)
      },
      set(value) {
        if (this.validate(value)) {
          this.$emit('input', parseJson(value))
        }
      }
    }
  },
  mounted() {
    if (this.isArray(this.value)) {
      return true
    }

    if (this.isArrayString(this.value)) {
      this.internalValue = this.value
    } else {
      this.internalValue = '[]'
    }
  },
  methods: {
    isArray(value) {
      return typeof value === 'object' && Array.isArray(value)
    },
    isArrayString(value) {
      return isValidJson(value) && this.isArray(parseJson(value))
    },
    isArrayOrArrayString(value) {
      return this.isArray(value) || this.isArrayString(value)
    },
    validate(value) {
      this.errors = this.getErrors(value)

      return this.errors.length === 0
    },
    getErrors(value) {
      if (value == null) {
        return ['Value is required']
      }

      if (!this.isArrayOrArrayString(value)) {
        return ['Value is expected to be a List']
      }

      return []
    }
  }
}
</script>
