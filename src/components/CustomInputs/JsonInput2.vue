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
import { formatJson, isValidJson } from '@/utils/jsonUtility'

export default {
  props: {
    value: {
      type: String,
      required: false,
      default: null
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
