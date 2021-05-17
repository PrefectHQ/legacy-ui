<script>
/* eslint-disable vue/no-v-html */
import { mapMutations } from 'vuex'

export default {
  props: {
    // Position the alert at the bottom of the screen.
    bottom: {
      type: Boolean,
      required: false,
      default: () => true
    },
    // Set dark theme
    dark: {
      type: Boolean,
      required: false,
      default: () => false
    },
    // Set light theme
    light: {
      type: Boolean,
      required: false,
      default: () => true
    },
    // Specify the message to display on the alert.
    message: {
      type: String,
      required: true
    },
    alertLink: {
      type: Object,
      required: false,
      default: null
    },
    nudgeBottom: {
      type: Boolean,
      required: false,
      default: false
    },
    linkText: {
      type: String,
      required: false,
      default: 'See Details'
    },
    // Move snackbar in the X direction by updating left/right margins.
    offsetX: {
      type: Number,
      required: false,
      default: () => 0
    },
    // Set the alert to disappear after a specified number of milliseconds.
    // Set this to 0 to render indefinitely (until the alert is closed by the user).
    timeout: {
      type: Number,
      required: false,
      default: () => 6000
    },
    // Position the alert at the top of the screen.
    top: {
      type: Boolean,
      required: false,
      default: () => false
    },
    // Position the alert at the right of the screen.
    right: {
      type: Boolean,
      required: false,
      default: () => false
    },
    // Position the alert at the left of the screen.
    left: {
      type: Boolean,
      required: false,
      default: () => false
    },
    // Specify the type of alert (error, info, success, etc.)
    type: {
      type: String,
      required: false,
      default: () => 'info'
    },
    // Prop that allows users to set v-model on the alert.
    value: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      internalValue: this.value,
      timeoutId: null
    }
  },
  watch: {
    value(val) {
      // Keep the internal state of the alert on par with the value prop.
      this.internalValue = val
      // If the alert is being displayed and a timeout is specified,
      // make the alert disappear after this.timeout milliseconds.
      if (this.internalValue && this.timeout) {
        if (this.timeoutId) clearTimeout(this.timeoutId)
        this.timeoutId = setTimeout(this.handleDismiss, this.timeout)
      }
    }
  },
  methods: {
    ...mapMutations('alert', ['setEmpty']),
    emitInternalValue() {
      this.$emit('input', this.internalValue)
    },
    handleDismiss() {
      this.setEmpty()
      this.internalValue = false
      this.emitInternalValue()
    },
    // Propagate the internal notification value to the component's parent.
    // This method is what allows us to set v-model on this component.
    handleInput() {
      this.emitInternalValue()
    }
  }
}
</script>

<template>
  <v-snackbar
    :top="top"
    :bottom="bottom"
    :right="right"
    :left="left"
    :value="internalValue"
    :timeout="-1"
    color="appBackground"
    :style="{
      'margin-left': offsetX > 0 ? `${offsetX}px` : '0',
      'margin-right': offsetX < 0 ? `${Math.abs(offsetX)}px` : '0',
      'margin-bottom': nudgeBottom ? '64px' : '0'
    }"
    @input="handleInput"
  >
    <v-icon v-if="type == 'error'" class="mr-4" color="red">warning</v-icon>

    <span class="text-subtitle-1 utilGrayDark--text" v-html="message"> </span>

    <template #action>
      <v-btn v-if="alertLink" color="pink" text :to="alertLink">
        <span>{{ linkText }}</span>
      </v-btn>
      <v-btn :color="type" text @click="handleDismiss">
        Dismiss
      </v-btn>
    </template>
  </v-snackbar>
</template>
