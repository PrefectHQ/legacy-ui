<template>
  <div class="code-input">
    <v-textarea
      v-model="internalValue"
      class="code-input__textarea"
      spellcheck="false"
      :error-messages="errors"
      outlined
      @blur="handleBlur"
    >
      <template #append>
        <highlight-code lang="json" class="code-input__preview">
          {{ internalValue }}
        </highlight-code>
      </template>
    </v-textarea>
  </div>
</template>

<script>
import { parseJson, formatJson, getJsonErrors } from '@/utils/json'

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
      const objectValue = parseJson(this.internalValue)
      const formatted = formatJson(objectValue)

      if (formatted != null) {
        this.internalValue = formatted
      }
    }
  }
}
</script>
