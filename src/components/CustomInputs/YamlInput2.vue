<template>
  <base-code-textarea
    v-model="internalValue"
    :readonly="readonly"
    :get-errors="getYamlErrors"
    :format="formatYaml"
    :parse="parseYaml"
    language="YAML"
  />
</template>

<script>
import BaseCodeTextarea from '@/components/CustomInputs/BaseCodeTextarea'
import { parseYaml, formatYaml, getYamlErrors } from '@/utils/yaml'

export default {
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
    getYamlErrors,
    parseYaml,
    formatYaml
  }
}
</script>
