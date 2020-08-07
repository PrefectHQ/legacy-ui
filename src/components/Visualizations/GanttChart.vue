<script>
export default {
  props: {
    groups: {
      type: Array,
      required: false,
      default: () => []
    },
    items: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  mounted() {
    console.log(this.groups)
    console.log(this.items)
  }
}
</script>

<template>
  <v-container>
    <canvas />
  </v-container>
</template>
