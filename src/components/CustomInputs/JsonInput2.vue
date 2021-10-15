<template>
  <div>
    <v-textarea
      ref="vTextArea"
      v-model="internalValue"
      :error-messages="inputErrors"
      outlined
      @blur="handleBlur"
    />
    <highlight-code lang="json">
      {{ internalValue }}
    </highlight-code>
  </div>
</template>

<script>
import { parseJson, formatJson, isValidJson } from '@/utils/json'

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
        if (this.valueIsObject) {
          return formatJson(this.value)
        }

        return this.value
      },
      set(value) {
        this.$emit('input', this.valueIsObject ? parseJson(value) : value)
      }
    },
    valueIsObject() {
      return this.value != null && typeof this.value === 'object'
    },
    inputErrors() {
      if (this.internalValue && !isValidJson(this.internalValue)) {
        return ['There is a syntax error in your JSON.']
      }

      return []
    }
  },
  methods: {
    handleBlur() {
      const formatted = formatJson(this.internalValue)

      if (formatted != null) {
        this.internalValue = formatted
      }
    }
  }
}
</script>
