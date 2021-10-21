<template>
  <v-radio-group
    v-model="internalValue"
    :error-messages="errors"
    outlined
    dense
    mandatory
    row
  >
    <v-radio label="true" :value="1" />
    <v-radio label="false" :value="0" />
  </v-radio-group>
</template>

<script>
export default {
  name: 'BooleanInput',
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
        return this.value ? 1 : 0
      },
      set(value) {
        if (this.validate(value)) {
          this.$emit('input', !!value)
        }
      }
    }
  },
  mounted() {
    if (typeof this.value != 'boolean') {
      this.internalValue = this.value === 1 || this.value === 'true'
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

      return []
    }
  }
}
</script>

<style lang="scss" scoped>
.v-input--selection-controls {
  margin-top: 4px;
}
</style>
