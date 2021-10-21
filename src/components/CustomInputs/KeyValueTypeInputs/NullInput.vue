<template>
  <v-text-field
    value="null"
    :error-messages="errors"
    v-bind="{ label: 'Value', outlined: true, dense: true }"
    disabled
  />
</template>

<script>
export default {
  name: 'NullInput',
  props: {
    value: {
      type: [String, Number, Boolean, Object, Array],
      required: false,
      default: null
    }
  },
  data() {
    return {
      errors: []
    }
  },
  mounted() {
    this.$emit('input', null)
  },
  methods: {
    validate(value) {
      this.errors = this.getErrors(value)

      return this.errors.length === 0
    },
    getErrors(value) {
      if (value !== null) {
        return ['Value is expected to be null']
      }

      return []
    }
  }
}
</script>
