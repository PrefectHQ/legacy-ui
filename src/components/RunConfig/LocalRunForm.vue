<template>
  <div class="run-config-form">
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading
          argument="env"
          title="Environment Variables"
          description="Additional environment variables to set for the process."
        />
      </v-col>
      <v-col cols="12" md="6">
        <dict-input :dict="internalValue.env" />
      </v-col>
    </v-row>
    <v-row class="run-config-form__row">
      <v-col cols="12" md="6">
        <argument-heading
          argument="working_dir"
          title="Working directory"
          description="The working directory in which to start the process; the directory must already exist. If not provided, will be run in the same directory as the agent was started."
        />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field
          v-model="internalValue.working_dir"
          placeholder="Default"
          label="Working directory"
          hide-details
          outlined
          dense
        />
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
