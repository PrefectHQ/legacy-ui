<template>
  <v-text-field
    v-model="internalValue"
    :error-messages="errors"
    v-bind="{ label: 'Value', outlined: true, dense: true }"
  />
</template>

<script>
import { isValidJson, parseJson, formatJson } from '@/utils/json'

export default {
  name: 'ObjectInput',
  props: {
    value: {
      type: [String, Number, Boolean, Object, Array],
      required: false,
      default: null
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
        return formatJson(this.value, 0)
      },
      set(value) {
        if (this.validate(value)) {
          this.$emit('input', parseJson(value))
        }
      }
    }
  },
  mounted() {
    if (this.isObject(this.value)) {
      return true
    }

    if (this.isObjectString(this.value)) {
      this.internalValue = this.value
    } else {
      this.internalValue = '{}'
    }
  },
  methods: {
    isObject(value) {
      return typeof value === 'object'
    },
    isObjectString(value) {
      return isValidJson(value) && typeof parseJson(value) == 'object'
    },
    isObjectOrObjectString(value) {
      return this.isObject(value) || this.isObjectString(value)
    },
    validate(value) {
      this.errors = this.getErrors(value)

      return this.errors.length === 0
    },
    getErrors(value) {
      if (value === null) {
        return ['Value is required']
      }

      if (!this.isObjectOrObjectString(value)) {
        return ['Value is not valid JSON']
      }

      return []
    }
  }
}
</script>
