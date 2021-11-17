<script>
export default {}
</script>

<template>
  <v-card class="upgrade-alert" tile>
    <v-card-text class="text-h5 font-weight-light mb-auto" tile
      >You're on a legacy Cloud plan
      <div class="text-subtitle-1"
        >Upgrade to get access to usage-based pricing and new features!</div
      >
    </v-card-text>

    <v-card-actions class="mt-auto">
      <v-spacer />
      <v-btn
        color="accentPink"
        depressed
        dark
        small
        target="_blank"
        :to="'/plans'"
      >
        Upgrade
      </v-btn>
      <v-btn small color="primary" text :to="'/admin/account'">
        Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.upgrade-alert {
  border-left: 6px solid var(--v-accentPink-base);
}
</style>
