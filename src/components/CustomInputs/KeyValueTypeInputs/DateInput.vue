<template>
  <date-time
    v-model="internalValue"
    :disabled="disabled"
    :text-field-props="{
      label: 'Value',
      outlined: true,
      dense: true,
      errorMessages: errors
    }"
    @input="validate"
  />
</template>

<script>
import DateTime from '@/components/DateTime'
import { isIsoDateString } from '@/utils/dateTime'

export default {
  name: 'DateInput',
  components: {
    DateTime
  },
  props: {
    value: {
      type: [String, Number, Boolean, Object, Array],
      required: false,
      default: null
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false
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
        if (typeof this.value != 'string' || !isIsoDateString(this.value)) {
          return null
        }

        return this.value
      },
      set(value) {
        this.$emit('input', value)
      }
    }
  },
  mounted() {
    if (typeof this.value != 'string' || !isIsoDateString(this.value)) {
      this.internalValue = new Date().toISOString()
    }
  },
  methods: {
    validate(value) {
      this.errors = this.getErrors(value)
      this.$emit('error', this.errors.length > 0)

      return this.errors.length == 0
    },
    getErrors(value) {
      if (value == null) {
        return ['Value is required']
      }

      if (!isIsoDateString(value)) {
        return ['Value is expected to be an ISO Date string']
      }

      return []
    }
  }
}
</script>
