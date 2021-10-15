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
        if (typeof this.value === 'object') {
          return formatJson(this.value)
        }

        return this.value
      },
      set(value) {
        if (typeof this.value === 'object') {
          this.$emit('input', parseJson(value))
        }

        this.$emit('input', value)
      }
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
