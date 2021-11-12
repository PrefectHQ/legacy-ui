<template>
  <v-text-field
    v-model="internalValue"
    :error-messages="errors"
    :disabled="disabled"
    label="Value"
    outlined
    dense
    @input="validate"
  />
</template>

<script>
import { tryFormatJson } from '@/utils/json'

export default {
  name: 'StringInput',
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
        return this.value
      },
      set(value) {
        this.$emit('input', value)
      }
    }
  },
  mounted() {
    if (typeof this.value == 'object') {
      this.internalValue = tryFormatJson(this.value) ?? ''
    } else if (typeof this.value != 'string') {
      this.internalValue = this.tryCallingToString(this.value) ?? ''
    }
  },
  methods: {
    tryCallingToString(value) {
      if (value != null && typeof this.value.toString === 'function') {
        return value.toString()
      }

      return null
    },
    validate(value) {
      this.errors = this.getErrors(value)

      return this.errors.length == 0
    },
    getErrors(value) {
      if (value === null) {
        return ['Value is required']
      }

      return []
    }
  }
}
</script>
