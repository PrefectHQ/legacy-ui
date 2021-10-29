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
import { types, isValidType } from '@/utils/types'

export default {
  name: 'JsonParsingInput',
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
    },
    types: {
      type: Array,
      required: false,
      default: () => types,
      validator: value => value.every(isValidType)
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
        return typeof this.value === 'object'
          ? tryFormatJson(this.value)
          : this.value
      },
      set(value) {
        if (this.validate(value)) {
          const converted = this.tryParsingFromString(value)

          this.$emit('input', converted)
        }
      }
    }
  },
  methods: {
    tryParsingFromString(value) {
      return isValidJson(value) ? tryParseJson(value) : value
    },
    validate(value) {
      this.errors = this.getErrors(value)

      return this.errors.length === 0
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
