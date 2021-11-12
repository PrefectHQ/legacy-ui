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
      <resettable-wrapper v-model="envValue" class="resettable-dictionary-json">
        <code-input ref="envInput" v-model="envValue" show-types />
      </resettable-wrapper>
    </argument-input>
    <argument-input
      argument="host_config"
      title="Host Config"
      description="Runtime arguments to pass to the Docker Agent."
    >
      <resettable-wrapper
        v-model="hostConfigValue"
        class="resettable-dictionary-json"
      >
        <code-input
          ref="hostConfigInput"
          v-model="hostConfigValue"
          show-types
        />
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
    },
    hostConfigValue: {
      get() {
        return tryFormatJson(this.internalValue.host_config)
      },
      set(value) {
        this.internalValue = { ...this.internalValue, host_config: value }
      }
    }
  },
  methods: {
    validate() {
      return (
        this.$refs.envInput.validate() && this.$refs.hostConfigInput.validate()
      )
    }
  }
}
</script>
