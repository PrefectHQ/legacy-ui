<template>
  <div class="run-config-form">
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading
          argument="env"
          title="Environment Variables"
          description="Additional environment variables to set in the container."
        />
      </v-col>
      <v-col cols="12" md="6">
        <dict-input :dict="internalValue.env" />
      </v-col>
    </v-row>
  </div>
</template>

<script>
import ArgumentHeading from '@/components/RunConfig/ArgumentHeading'
import DictInput from '@/components/CustomInputs/DictInput'

export default {
  components: {
    ArgumentHeading,
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
