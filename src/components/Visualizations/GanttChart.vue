<script>
export default {
  params: {
    items: {
      type: Array,
      required: false,
      default: () => []
    }
  }
}
</script>

<template>
  <v-container>
    <canvas />
  </v-container>
</template>
