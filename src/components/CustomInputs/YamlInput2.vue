<template>
  <div>
    <v-textarea
      v-model="internalValue"
      :error-messages="inputErrors"
      outlined
      @blur="handleBlur"
    >
      <template #message="{message}">
        <p style="white-space: pre-line">
          {{ message }}
        </p>
      </template>
    </v-textarea>
    <highlight-code lang="yaml">
      {{ internalValue }}
    </highlight-code>
  </div>
</template>

<script>
import { formatYaml, getYamlErrors } from '@/utils/yamlUtility'

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
      if (!this.isValid) {
        return this.yamlErrors
      }

      return []
    },
    isValid() {
      return this.yamlErrors.length == 0
    },
    yamlErrors() {
      return getYamlErrors(this.internalValue)
    }
  },
  methods: {
    handleBlur() {
      const formatted = formatYaml(this.internalValue)

      if (formatted != null) {
        this.internalValue = formatted
      }
    }
  }
}
</script>
