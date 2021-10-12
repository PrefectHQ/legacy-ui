<template>
  <div class="run-config-form">
    <argument-input
      argument="env"
      title="Environment Variables"
      description="Additional environment variables to set in the container."
    >
      <dict-input v-model="internalValue.env" />
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
