<script>
export default {}
</script>

<template>
  <v-footer color="transparent" padless>
    <v-card flat tile width="100%" class="text-center transparent">
      <v-card-text>
        <v-btn depressed icon class="mx-4">
          <v-icon>fab fa-twitter</v-icon>
        </v-btn>
        <v-btn depressed icon class="mx-4">
          <v-icon>fab fa-slack</v-icon>
        </v-btn>
        <v-btn depressed icon class="mx-4">
          <v-icon>fab fa-instagram</v-icon>
        </v-btn>
        <v-btn depressed icon class="mx-4">
          <v-icon>fab fa-github</v-icon>
        </v-btn>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-text>
        {{ new Date().getFullYear() }} — <strong>Prefect</strong>
      </v-card-text>
    </v-card>
  </v-footer>
</template>

<style lang="scss" scoped>
/* // */
</style>
