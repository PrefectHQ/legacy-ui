<template>
  <div class="run-config-form">
    <argument-input
      argument="env"
      title="Environment Variables"
      description="Additional environment variables to set for the process."
    >
      <resettable-wrapper v-model="envValue" class="resettable-dictionary">
        <code-input v-model="envValue" show-types />
      </resettable-wrapper>
    </argument-input>
    <argument-input
      v-model="internalValue.working_dir"
      argument="working_dir"
      title="Working directory"
      description="The working directory in which to start the process; the directory must already exist. If not provided, will be run in the same directory as the agent was started."
    />
  </div>
</template>

<script>
import ArgumentInput from '@/components/RunConfig/ArgumentInput'
import CodeInput from '@/components/CustomInputs/CodeInput'
import ResettableWrapper from '@/components/CustomInputs/ResettableWrapper'
import { formatJson } from '@/utils/json'

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
        return typeof this.internalValue.env === 'object'
          ? formatJson(this.internalValue.env)
          : this.internalValue.env
      },
      set(value) {
        this.internalValue = { ...this.internalValue, env: value }
      }
    }
  }
}
</script>
