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
      <dict-input v-model="internalValue.env" />
    </argument-input>
    <argument-input
      argument="host_config"
      title="Host Config"
      description="Runtime arguments to pass to the Docker Agent."
    >
      <dict-input v-model="internalValue.host_config" />
    </argument-input>
  </div>
</template>

<script>
import ArgumentInput from '@/components/RunConfig/ArgumentInput'
import DictInput from '@/components/CustomInputs/DictInput'

export default {
  components: {
    ArgumentInput,
    DictInput
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
