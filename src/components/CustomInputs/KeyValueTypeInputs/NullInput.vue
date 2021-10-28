<template>
  <v-text-field
    value="null"
    :error-messages="errors"
    disabled
    v-bind="{ label: 'Value', outlined: true, dense: true }"
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
  computed: {
    internalValue: {
      get() {
        return this.value
      },
      set(value) {
        if (this.validate(value)) {
          this.$emit('input', value)
        }
      }
    }
  },
  mounted() {
    if (this.value != null) {
      this.internalValue = null
    }
  },
  methods: {
    validate(value) {
      this.errors = this.getErrors(value)

      return this.errors.length === 0
    },
    getErrors(value) {
      if (value !== null) {
        return ['Value is expected to be None']
      }

      return []
    }
  }
}
</script>
