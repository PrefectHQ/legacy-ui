<template>
  <div class="run-config-form">
    <argument-input
      argument="env"
      title="Environment Variables"
      description="Additional environment variables to set for the process."
    >
      <code-input v-model="internalValue.env" />
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
    }
  }
}
</script>
