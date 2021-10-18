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
        <highlight-code lang="yaml" class="code-input__preview">
          {{ internalValue }}
        </highlight-code>
      </template>
      <template #message="{message}">
        <p style="white-space: pre-line">
          {{ message }}
        </p>
      </template>
    </v-textarea>
  </div>
</template>

<script>
import { parseYaml, formatYaml, getYamlErrors } from '@/utils/yaml'

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
      return getYamlErrors(this.internalValue)
    }
  },
  methods: {
    handleBlur() {
      const objectValue = parseYaml(this.internalValue)
      const formatted = formatYaml(objectValue)

      if (formatted != null) {
        this.internalValue = formatted
      }
    }
  }
}
</script>
