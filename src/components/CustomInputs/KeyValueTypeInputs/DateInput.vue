<template>
  <date-time
    v-model="internalValue"
    :text-field-props="{
      label: 'Value',
      outlined: true,
      dense: true,
      errorMessages: errors
    }"
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
    if (typeof this.value != 'string' || !isIsoDateString(this.value)) {
      this.internalValue = new Date().toISOString()
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

      if (!isIsoDateString(value)) {
        return ['Value is expected to be an ISO Date string']
      }

      return []
    }
  }
}
</script>
