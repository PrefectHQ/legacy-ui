<template>
  <div class="resettable-wrapper">
    <div class="resettable-wrapper__button-container">
      <v-btn
        class="text-normal"
        color="utilGrayLight"
        title="Reset"
        :disabled="initialValue == value"
        x-small
        depressed
        @click="reset"
      >
        Reset
        <v-icon small>refresh</v-icon>
      </v-btn>
    </div>
    <div class="resettable-wrapper__slot-container">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResettableWrapper',
  props: {
    value: {
      type: [String, Boolean, Number, Array, Object, Function, Promise],
      required: false,
      default: true
    }
  },
  data() {
    return {
      initialValue: null
    }
  },
  created() {
    this.initialValue = this.value
  },
  methods: {
    reset() {
      this.$emit('input', this.initialValue)
    }
  }
}
</script>

<style lang="scss" scoped>
.resettable-wrapper__button-container {
  display: flex;
  justify-content: end;
  margin-bottom: 8px;
}
</style>
