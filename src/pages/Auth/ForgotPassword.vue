<script>
import { authMixin } from '@/mixins/authMixin.js'

export default {
  mixins: [authMixin],
  data() {
    return {
      email: null,
      error: null,
      success: false
    }
  }
}
</script>

<template>
  <v-container fluid>
    <div
      class="subtitle-1 my-4 font-weight-bold text-center grey--text text--darken-2"
    >
      Recover Password
    </div>

    <v-form
      class="text-center"
      :class="error ? 'mb-5' : 'mb-12'"
      @submit.prevent="resetPassword"
      @keyup.enter="resetPassword"
    >
      <div
        v-if="!success && !error"
        class="my-2 mb-10 arboria text-center body-2 mx-auto"
      >
        <div class="primary--text font-weight-bold body-1">Don't panic!</div>
        We’ll email you instructions to reset your password.
      </div>

      <transition-group name="fade" mode="out-in">
        <div v-if="!success && !error" key="field" class="my-4">
          <v-text-field
            v-model="email"
            class="arboria"
            outlined
            type="email"
            label="Your email"
            hide-details
            prepend-inner-icon="email"
          />
        </div>

        <div v-else-if="success" key="success" class="my-4 primary--text">
          <v-icon x-large class="mx-auto mb-4" color="primary">
            mail_outline
          </v-icon>
          <div>
            Please check the email address
            <span class="font-weight-bold">{{ email }}</span> for instructions
            on resetting your password.
          </div>
        </div>

        <div v-else key="error" class="my-4">
          <div v-if="error" class="error--text arboria text-center">
            {{ error }}
          </div>
        </div>
      </transition-group>

      <v-btn
        v-if="!success && !error"
        color="primary"
        class="btn btn-primary btn-block mt-10"
        height="45"
        type="submit"
        block
        depressed
      >
        Send me a recovery link
      </v-btn>
    </v-form>

    <div class="caption mt-12 text-center d-flex align-center justify-center">
      <router-link :to="{ name: 'login' }">
        <div class="d-flex align-center justify-center">
          <v-icon>keyboard_arrow_left</v-icon>Back to sign in
        </div>
      </router-link>
    </div>
  </v-container>
</template>

<style>
/* // */
</style>
