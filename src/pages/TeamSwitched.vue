<script>
export default {
  metaInfo() {
    return {
      titleTemplate: '%s - Team switched'
    }
  }
}
</script>

<template>
  <div
    class="team-switched"
    :class="{
      small: $vuetify.breakpoint.sm,
      med: $vuetify.breakpoint.mdAndUp,
      mobile: $vuetify.breakpoint.xs
    }"
  >
    <div class="text py-16 px-8 rounded white--text">
      <div class="text-h4">Team switched</div>
      <div class="text-subtitle-1">
        It looks like you switched your team in a different tab. If you believe
        this is an error, contact us at help@prefect.io
      </div>

      <v-btn color="white" class="primary--text" depressed :to="'/'" exact>
        <v-icon>arrow_back_ios</v-icon>
        Back to the dashboard
      </v-btn>
    </div>
  </div>
</template>

<style lang="scss" scoped>
i {
  text-decoration: none;
}

.team-switched {
  background-color: var(--v-primary-base) !important;
  background-image: url('../assets/backgrounds/gradient_background.svg') !important;
  //   background-position: left !important;
  //   background-repeat: no-repeat !important;
  background-size: cover !important;
  height: 100vh;

  .text {
    background-color: rgba(0, 0, 0, 0.2);
    position: fixed;
    top: 15%;
  }

  &.small {
    .text {
      left: 25%;
    }
  }

  &.med {
    .text {
      left: 20%;
    }
  }

  &.mobile {
    .text {
      left: 5%;
    }
  }
}
</style>
