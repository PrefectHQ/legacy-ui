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
import { parseYaml, formatYaml, getYamlErrors } from '@/utils/yaml'

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
          return formatYaml(this.value)
        }

        return this.value
      },
      set(value) {
        this.$emit('input', this.valueIsObject ? parseYaml(value) : value)
      }
    },
    valueIsObject() {
      return this.value != null && typeof this.value === 'object'
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
