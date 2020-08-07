<script>
export default {
  props: {
    items: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  mounted() {
    console.log(this.items)
  }
}
</script>

<template>
  <v-container>
    <canvas />
  </v-container>
</template>
