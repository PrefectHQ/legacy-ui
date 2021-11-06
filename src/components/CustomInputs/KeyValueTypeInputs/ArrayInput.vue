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
import {
  isValidJson,
  tryParseJson,
  tryFormatSingleLineJson
} from '@/utils/json'

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
        return tryFormatSingleLineJson(this.value)
      },
      set(value) {
        this.$emit('input', tryParseJson(value) ?? value)
      }
    }
  },
  mounted() {
    if (this.isArray(this.value)) {
      return
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
      return isValidJson(value) && this.isArray(tryParseJson(value))
    },
    isArrayOrArrayString(value) {
      return this.isArray(value) || this.isArrayString(value)
    },
    validate(value) {
      this.errors = this.getErrors(value)
      this.$emit('error', this.errors.length > 0)

      return this.errors.length == 0
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
