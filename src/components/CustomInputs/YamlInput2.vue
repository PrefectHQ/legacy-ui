<template>
  <div>
    <v-textarea
      v-model="internalValue"
      :error-messages="inputErrors"
      outlined
      @blur="format"
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
import YAML from 'yaml'

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
      if (!this.internalValue) {
        return []
      }

      try {
        YAML.parse(this.internalValue)
        return []
      } catch (e) {
        return [e.toString().trim()]
      }
    }
  },
  methods: {
    format() {
      if (!this.internalValue) {
        return null
      }

      try {
        const yaml = YAML.parse(this.internalValue)
        this.internalValue = YAML.stringify(yaml)
      } catch {
        return
      }
    }
  }
}
</script>
