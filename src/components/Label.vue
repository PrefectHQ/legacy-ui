<script>
export default {
  props: {
    disabled: {
      type: Boolean,
      default: false,
      required: false
    },
    duplicate: {
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
    },
    duplicatedColor() {
      return this.duplicate ? 'error' : 'primary'
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
    :disabled="disabled"
    :color="duplicatedColor"
    class="pr-0 overflow"
    :outlined="outlined"
    :x-large="size === 'x-large'"
    :large="size === 'large'"
    :small="size === 'small'"
    :x-small="size === 'x-small'"
    style="user-select: auto;"
  >
    <slot></slot>
    <v-tooltip bottom>
      <template v-slot:activator="{ on }">
        <v-btn
          :disabled="disabled"
          :color="duplicatedColor"
          :loading="loading"
          icon
          ><v-icon small :color="duplicatedColor" @click="handleClick" v-on="on"
            >fa-times-circle</v-icon
          >
        </v-btn>
      </template>
      Remove this label
    </v-tooltip>
  </v-chip>
</template>

<style lang="scss" scoped>
.v-chip--disabled {
  opacity: 1;
}

.overflow {
  max-width: 800px !important;
  overflow-x: hidden;
}
</style>
