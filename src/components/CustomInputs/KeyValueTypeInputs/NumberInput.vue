<template>
  <v-text-field
    v-model.number="internalValue"
    :error-messages="errors"
    type="number"
    v-bind="{ label: 'Value', outlined: true, dense: true }"
  />
</template>

<script>
export default {
  name: 'NumberInput',
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
    if (typeof this.value != 'number') {
      const parsed = Number(this.value)

      this.internalValue = isNaN(parsed) ? 0 : parsed
    }
  },
  methods: {
    validate(value) {
      this.errors = this.getErrors(value)

      return this.errors.length === 0
    },
    getErrors(value) {
      if (value == null) {
        return ['Value is required']
      }

      if (isNaN(value)) {
        return ['Value is expected to be an Integer']
      }

      return []
    }
  }
}
</script>
