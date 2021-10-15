<template>
  <div>
    <v-textarea
      v-model="internalValue"
      :error-messages="errors"
      outlined
      @blur="handleBlur"
    />
    <highlight-code lang="json">
      {{ internalValue }}
    </highlight-code>
  </div>
</template>

<script>
import { formatJson, getJsonErrors } from '@/utils/json'

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
    errors() {
      return getJsonErrors(this.internalValue)
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
