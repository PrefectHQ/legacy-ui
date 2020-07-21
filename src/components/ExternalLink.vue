<script>
export default {
  props: {
    href: {
      type: String,
      required: true
    }
  }
}
</script>

<template>
  <span>
    <a :href="href" target="_blank" rel="noopener noreferrer">
      <slot></slot>
    </a>
    <sup>
      <v-icon x-small>
        open_in_new
      </v-icon>
    </sup>
  </span>
</template>

<style lang="scss" scoped>
a {
  text-decoration: none !important;
}
</style>
