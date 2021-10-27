<template>
  <base-code-textarea
    v-model="internalValue"
    :readonly="readonly"
    :placeholder="placeholder"
    :get-errors="getYamlErrors"
    :format="formatYaml"
    :parse="parseYaml"
    language="yaml"
  />
</template>

<script>
import BaseCodeTextarea from '@/components/CustomInputs/BaseCodeTextarea'
import { parseYaml, formatYaml, getYamlErrors } from '@/utils/yaml'

export default {
  name: 'YamlInput',
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
    },
    placeholder: {
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
    }
  },
  methods: {
    getYamlErrors,
    parseYaml,
    formatYaml
  }
}
</script>
