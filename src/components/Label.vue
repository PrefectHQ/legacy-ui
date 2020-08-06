<script>
export default {
  props: {
    clickable: {
      type: Boolean,
      default: false,
      required: false
    },
    outlined: {
      type: Boolean,
      default: true,
      required: false
    },
    size: {
      type: String,
      default: 'small',
      required: false
    }
  },
  methods: {
    handleClick() {
      this.$emit('click', this.$slots.default[0].text)
    }
  }
}
</script>

<template>
  <v-chip
    :disabled="!clickable"
    color="primary"
    :outlined="outlined"
    :x-large="size === 'x-large'"
    :large="size === 'large'"
    :small="size === 'small'"
    :x-small="size === 'x-small'"
    style="user-select: auto;"
    @click="handleClick"
  >
    <slot></slot>
  </v-chip>
</template>

<style lang="scss" scoped>
.v-chip--disabled {
  opacity: 1;
}
</style>
