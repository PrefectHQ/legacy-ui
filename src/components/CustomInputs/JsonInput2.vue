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
export default {
  props: {
    value: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      tabSpaces: 4
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
        return ['There is a syntax error in your JSON.']
      }

      return []
    },
    isValid() {
      try {
        JSON.parse(this.internalValue)
        return true
      } catch (e) {
        return false
      }
    }
  },
  methods: {
    handleBlur() {
      try {
        const json = JSON.parse(this.internalValue)
        this.internalValue = JSON.stringify(json, null, this.tabSpaces)
      } catch {
        return
      }
    }
  }
}
</script>
