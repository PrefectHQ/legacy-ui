<script>
import { mapActions } from 'vuex'
import { logout } from '@/auth/index.js'

export default {
  data() {
    return {
      origin: window.location.origin
    }
  },
  methods: {
    ...mapActions('auth', ['login']),
    async logOut() {
      await logout()
    }
  }
}
</script>

<template>
  <div
    class="access-denied"
    :class="{
      small: $vuetify.breakpoint.sm,
      med: $vuetify.breakpoint.mdAndUp,
      mobile: $vuetify.breakpoint.xs
    }"
  >
    <div class="text py-16 px-8 rounded">
      <h1>Oops!</h1>
      <p>
        It looks like you don't have access to this application. If you believe
        this is an error, contact us at help@prefect.io
      </p>

      <v-btn
        v-if="origin !== 'cloud.prefect.io'"
        color="white"
        class="primary--text"
        depressed
        href="https://cloud.prefect.io"
      >
        <v-icon class="mr-4">cloud</v-icon>
        Take me to Prefect Cloud
      </v-btn>

      <v-btn
        v-else
        color="white"
        class="primary--text"
        depressed
        @click="logOut"
      >
        <v-icon>arrow_back_ios</v-icon>
        Sign out
      </v-btn>
    </div>
  </div>
</template>

<style lang="scss" scoped>
i {
  text-decoration: none;
}

.access-denied {
  background-color: var(--v-primary-base) !important;
  background-image: url('../assets/backgrounds/not-found.svg') !important;
  background-position: left !important;
  background-repeat: no-repeat !important;
  background-size: cover !important;
  color: var(--v-cloudUIPrimaryLight-base);
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
