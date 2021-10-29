<template>
  <div class="run-config-form">
    <argument-input
      argument="env"
      title="Environment Variables"
      description="Additional environment variables to set in the container."
    >
      <resettable-wrapper v-model="envValue" class="resettable-dictionary-json">
        <code-input v-model="envValue" show-types />
      </resettable-wrapper>
    </argument-input>
  </div>
</template>

<script>
import ArgumentInput from '@/components/RunConfig/ArgumentInput'
import CodeInput from '@/components/CustomInputs/CodeInput'
import ResettableWrapper from '@/components/CustomInputs/ResettableWrapper'
import { tryFormatJson } from '@/utils/json'

export default {
  components: {
    ArgumentInput,
    ResettableWrapper,
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
        return tryFormatJson(this.internalValue.env)
      },
      set(value) {
        this.internalValue = { ...this.internalValue, env: value }
      }
    }
  }
}
</script>
