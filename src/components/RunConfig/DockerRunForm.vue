<template>
  <div class="run-config-form">
    <argument-input
      v-model="internalValue.image"
      argument="image"
      title="Image"
      description="The image to use."
    />
    <argument-input
      argument="env"
      title="Environment Variables"
      description="Additional environment variables to set in the container."
    >
      <code-input v-model="internalValue.env" />
    </argument-input>
    <argument-input
      argument="host_config"
      title="Host Config"
      description="Runtime arguments to pass to the Docker Agent."
    >
      <code-input v-model="internalValue.host_config" />
    </argument-input>
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
