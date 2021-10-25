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
      <resettable-wrapper v-model="envValue" class="resettable-dictionary">
        <code-input v-model="envValue" show-types />
      </resettable-wrapper>
    </argument-input>
    <argument-input
      argument="host_config"
      title="Host Config"
      description="Runtime arguments to pass to the Docker Agent."
    >
      <resettable-wrapper
        v-model="hostConfigValue"
        class="resettable-dictionary"
      >
        <code-input v-model="hostConfigValue" show-types />
      </resettable-wrapper>
    </argument-input>
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
    },
    hostConfigValue: {
      get() {
        return typeof this.internalValue.host_config === 'object'
          ? formatJson(this.internalValue.host_config)
          : this.internalValue.host_config
      },
      set(value) {
        this.internalValue = { ...this.internalValue, host_config: value }
      }
    }
  }
}
</script>
