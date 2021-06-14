<script>
export default {
  props: {
    team: {
      required: true,
      type: Object
    }
  }
}
</script>

<template>
  <v-card class="utilGrayDark--text mx-4" flat outlined>
    <v-card-text>{{ team.name }} </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
/* */
</style>
