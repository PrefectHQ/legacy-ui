<template>
  <base-code-textarea
    v-model="internalValue"
    :readonly="readonly"
    :get-errors="getJsonErrors"
    :format="formatJson"
    :parse="parseJson"
    language="json"
  />
</template>

<script>
import BaseCodeTextarea from '@/components/CustomInputs/BaseCodeTextarea'
import { parseJson, formatJson, getJsonErrors } from '@/utils/json'

export default {
  name: 'JsonInput',
  components: {
    BaseCodeTextarea
  },
  props: {
    value: {
      type: String,
      required: false,
      default: null
    },
    readonly: {
      type: Boolean,
      required: false,
      default: false
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
    }
  },
  methods: {
    getJsonErrors,
    parseJson,
    formatJson
  }
}
</script>
