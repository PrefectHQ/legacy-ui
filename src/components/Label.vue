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
    loading: {
      type: Boolean,
      default: false,
      required: false
    },
    size: {
      type: String,
      default: 'small',
      required: false
    }
  },
  computed: {
    closeIcon() {
      return this.loading ? 'fa-spinner' : 'fa-times-circle'
    }
  },
  methods: {
    handleClick() {
      this.$emit('click', this.$slots.default[0].text, this.index)
    }
  }
}
</script>

<template>
  <v-chip
    :disabled="!clickable"
    color="primary"
    class="pr-0"
    :outlined="outlined"
    :x-large="size === 'x-large'"
    :large="size === 'large'"
    :small="size === 'small'"
    :x-small="size === 'x-small'"
    style="user-select: auto;"
  >
    <slot></slot>
    <v-btn color="primary" :loading="loading" icon
      ><v-icon small color="primary" @click="handleClick"
        >fa-times-circle</v-icon
      >
    </v-btn>
  </v-chip>
</template>

<style lang="scss" scoped>
.v-chip--disabled {
  opacity: 1;
}
</style>
