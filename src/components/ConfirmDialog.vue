<script>
export default {
  props: {
    // Text displayed on the cancel button
    cancelText: {
      type: String,
      required: false,
      default: () => 'Cancel'
    },
    // Props to pass to cancel button
    cancelProps: {
      type: Object,
      required: false,
      default: () => ({})
    },
    // Props to pass to confirm button
    confirmProps: {
      type: Object,
      required: false,
      default: () => ({})
    },
    // Text displayed on the confirmation button
    confirmText: {
      type: String,
      required: false,
      default: () => 'Confirm'
    },
    // Props to pass to v-dialog component
    dialogProps: {
      type: Object,
      required: false,
      default: () => ({})
    },
    // Disable confirmation button
    disabled: {
      type: Boolean,
      required: false,
      default: () => false
    },
    // Any error messages associated with the dialog
    error: {
      type: String,
      required: false,
      default: () => ''
    },
    // Display loader on confirmation button
    loading: {
      type: Boolean,
      required: false,
      default: () => false
    },
    // Title on dialog card
    title: {
      type: String,
      required: false,
      default: () => ''
    },
    // Specify the type of alert
    // - "primary", the default, is typically used for save actions
    // - "error" is typically used for destructive actions
    type: {
      type: String,
      required: false,
      default: () => 'primary'
    },
    // Prop that allows users to set v-model on the dialog
    value: {
      type: Boolean,
      required: true
    },
    width: {
      type: String,
      required: false,
      default: ''
    }
  },
  data() {
    return {
      internalValue: this.value
    }
  },
  watch: {
    value(val) {
      // Keep the internal state of the alert on par with the value prop.
      this.internalValue = val
    }
  },
  methods: {
    emitInternalValue() {
      this.$emit('input', this.internalValue)
    },
    handleCancel() {
      this.internalValue = false
      this.$emit('cancel')
      this.emitInternalValue()
    },
    handleConfirm() {
      this.$emit('confirm')
      this.emitInternalValue()
    },
    // Propagate the internal value to the component's parent.
    // This method is what allows us to set v-model on this component.
    handleInput() {
      this.emitInternalValue()
    }
  }
}
</script>

<template>
  <v-dialog
    :value="internalValue"
    v-bind="dialogProps"
    :width="width"
    @input="handleInput"
    @click:outside="handleCancel"
    @keydown.esc="handleCancel"
  >
    <v-card flat>
      <v-card-title class="headline word-break-normal mb-3" primary-title>
        {{ title }}
      </v-card-title>

      <v-card-text class="pb-0">
        <slot></slot>
      </v-card-text>

      <v-card-actions class="pb-4 px-6">
        <div class="error--text .body-2	">{{ error }}</div>
        <v-spacer></v-spacer>
        <v-btn
          text
          :data-cy="cancelProps['data-cy'] || 'cancel'"
          v-bind="cancelProps"
          @click="handleCancel"
        >
          {{ cancelText }}
        </v-btn>
        <v-btn
          depressed
          :color="type"
          :data-cy="confirmProps['data-cy'] || 'confirm'"
          :loading="loading"
          :disabled="disabled"
          v-bind="confirmProps"
          @click="handleConfirm"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
