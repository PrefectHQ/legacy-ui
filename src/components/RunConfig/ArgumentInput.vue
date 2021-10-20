<template>
  <v-row class="run-config-form__row">
    <v-col cols="12" md="6">
      <argument-heading :argument="argument" :title="title">
        <slot name="description">
          {{ description }}
        </slot>
      </argument-heading>
    </v-col>
    <v-col cols="12" md="6" class="run-config-form__input">
      <slot>
        <v-text-field
          v-model="internalValue"
          placeholder="Default"
          :label="title"
          hide-details
          outlined
          dense
        />
      </slot>
    </v-col>
  </v-row>
</template>

<script>
import ArgumentHeading from '@/components/RunConfig/ArgumentHeading'

export default {
  components: {
    ArgumentHeading
  },
  props: {
    argument: {
      type: String,
      required: false,
      default: ''
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false,
      default: ''
    },
    value: {
      type: String,
      required: false,
      default: ''
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
