<template>
  <v-text-field
    v-model="internalValue"
    :error-messages="errors"
    v-bind="{ label: 'Value', outlined: true, dense: true }"
  />
</template>

<script>
import { isValidJson, parseJson, formatJson } from '@/utils/json'
import { types, isValidType } from '@/utils/types'

export default {
  name: 'JsonParsingInput',
  props: {
    value: {
      type: [String, Number, Boolean, Object, Array],
      required: false,
      default: null
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
          ? formatJson(this.value)
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
      return isValidJson(value) ? parseJson(value) : value
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
