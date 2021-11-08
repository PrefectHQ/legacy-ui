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
        return tryFormatSingleLineJson(this.value)
      },
      set(value) {
        this.$emit('input', tryParseJson(value) ?? value)
      }
    }
  },
  mounted() {
    if (this.isObject(this.value)) {
      return
    }

    if (
      this.isObjectString(this.value) &&
      !this.isArrayOrArrayString(this.value)
    ) {
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
    isArrayOrArrayString(value) {
      return Array.isArray(value) || Array.isArray(tryParseJson(value))
    },
    validate(value) {
      this.errors = this.getErrors(value)

      return this.errors.length == 0
    },
    getErrors(value) {
      if (value === null) {
        return ['Value is required']
      }

      if (
        !this.isObjectOrObjectString(value) ||
        this.isArrayOrArrayString(value)
      ) {
        return ['Value is not valid Dictionary']
      }

      return []
    }
  }
}
</script>
