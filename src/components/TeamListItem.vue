<script>
export default {
  props: {
    team: {
      required: true,
      type: Object
    }
  },
  mounted() {
    console.log(this.team)
  }
}
</script>

<template>
  <v-card class="utilGrayDark--text mx-4 team-card" flat outlined>
    <v-card-title>
      <v-avatar color="primary" size="56">
        {{ team.name[1] }}
      </v-avatar>
      {{ team.name }}
    </v-card-title>
    <v-card-text> </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.team-card {
  height: 300px;
  width: 350px;
}
</style>
