<template>
  <v-text-field
    v-model="internalValue"
    :error-messages="errors"
    :disabled="disabled"
    label="Value"
    outlined
    dense
  />
</template>

<script>
import { isValidJson, tryParseJson, tryFormatJson } from '@/utils/json'

export default {
  name: 'ObjectInput',
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
        return tryFormatJson(this.value)
      },
      set(value) {
        if (this.validate(value)) {
          this.$emit('input', tryParseJson(value))
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
      return isValidJson(value) && typeof tryParseJson(value) == 'object'
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
