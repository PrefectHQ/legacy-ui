<template>
  <div class="run-config-form">
    <argument-input
      argument="env"
      title="Environment Variables"
      description="Additional environment variables to set in the container."
    >
      <code-input v-model="envValue" />
    </argument-input>
  </div>
</template>

<script>
import ArgumentInput from '@/components/RunConfig/ArgumentInput'
import CodeInput from '@/components/CustomInputs/CodeInput'
import { formatJson } from '@/utils/json'

export default {
  components: {
    ArgumentInput,
    CodeInput
  },
  props: {
    value: {
      type: Object,
      required: true
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
    envValue: {
      get() {
        return typeof this.internalValue.env === 'object'
          ? formatJson(this.internalValue.env)
          : this.internalValue.env
      },
      set(value) {
        this.internalValue.env = value
      }
    }
  }
}
</script>
