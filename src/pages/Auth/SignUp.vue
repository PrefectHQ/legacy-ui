<script>
import { authMixin } from '@/mixins/authMixin.js'

const lowercase = /(?=.*[a-z])/g

const uppercase = /(?=.*[A-Z])/g

const numbers = /(?=.*[0-9])/g

const special = /(?=.*[!@#$%^&*(),.?":{}|<>])/g

export default {
  mixins: [authMixin],
  data() {
    return {
      email: null,
      error: null,
      password: null,
      passwordConfirm: null,
      passwordHintIsShown: true,
      passwordIsFocused: false,
      rules: {
        email: val => {
          const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
          return pattern.test(val) || 'Invalid e-mail'
        },
        required: val => !!val || 'Required',
        match: val => val === this.password || 'Passwords do not match'
      },
      validation: {
        length: null,
        lowercase: null,
        uppercase: null,
        numbers: null,
        special: null
      }
    }
  },
  computed: {
    passwordMeets3SubCriteria() {
      return (
        [
          this.validation.lowercase,
          this.validation.uppercase,
          this.validation.numbers,
          this.validation.special
        ].filter(i => i)?.length >= 3
      )
    },
    passwordMeetsCriteria() {
      return this.validation.length && this.passwordMeets3SubCriteria
    }
  },
  watch: {
    passwordMeetsCriteria(val) {
      if (val) {
        setTimeout(() => {
          this.passwordHintIsShown = false
        }, 500)
      } else {
        this.passwordHintIsShown = true
      }
    },
    password() {
      this.error = null
    },
    email() {
      this.error = null
    },
    passwordConfirm() {
      this.error = null
    }
  },
  methods: {
    blur() {
      this.passwordIsFocused = false
    },
    focus() {
      this.passwordIsFocused = true
    },
    validate() {
      this.validation.length = this.password?.length >= 10

      this.validation.lowercase = lowercase.test(this.password)
      this.validation.uppercase = uppercase.test(this.password)
      this.validation.numbers = numbers.test(this.password)
      this.validation.special = special.test(this.password)
    }
  }
}
</script>

<template>
  <v-container fluid>
    <div
      class="subtitle-1 my-4 font-weight-bold text-center grey--text text--darken-2"
    >
      Create Account
    </div>

    <v-form
      class="text-center"
      :class="error ? 'mb-5' : 'mb-8'"
      @submit.prevent="signup"
      @keyup.enter="signup"
    >
      <div class="mb-3">
        <v-text-field
          v-model="email"
          class="arboria"
          outlined
          type="email"
          label="Email"
          prepend-inner-icon="email"
          :rules="[rules.required, rules.email]"
        />
      </div>
      <div class="position-relative mb-3">
        <v-text-field
          v-model="password"
          class="arboria"
          outlined
          type="password"
          autocomplete="off"
          label="Password"
          prepend-inner-icon="lock"
          :rules="[rules.required]"
          @focus="focus"
          @blur="blur"
          @keyup="validate"
        />

        <transition name="hint">
          <div
            v-if="passwordIsFocused && passwordHintIsShown"
            class="password-hint-container"
          >
            <v-card
              class="caption pa-4 text-left password-hint"
              tile
              elevation="4"
            >
              <v-card-text class="pa-0">
                <div :class="passwordMeetsCriteria ? 'success--text' : ''">
                  Your password must contain:
                </div>
                <div
                  class="ml-4"
                  :class="validation.length ? 'success--text' : ''"
                >
                  At least 10 characters
                </div>
                <div
                  class="ml-4"
                  :class="passwordMeets3SubCriteria ? 'success--text' : ''"
                >
                  At least 3 of the following:
                </div>
                <div
                  class="ml-8"
                  :class="validation.lowercase ? 'success--text' : ''"
                >
                  Lower case letters (a-z)
                </div>
                <div
                  class="ml-8"
                  :class="validation.uppercase ? 'success--text' : ''"
                >
                  Upper case letters (A-Z)
                </div>
                <div
                  class="ml-8"
                  :class="validation.numbers ? 'success--text' : ''"
                >
                  Numbers (0-9)
                </div>
                <div
                  class="ml-8"
                  :class="validation.special ? 'success--text' : ''"
                >
                  Special characters (ex. !@#)
                </div>
              </v-card-text>
            </v-card>
          </div>
        </transition>
      </div>

      <div class="position-relative">
        <v-text-field
          v-model="passwordConfirm"
          class="arboria"
          outlined
          type="password"
          autocomplete="off"
          label="Confirm Password"
          prepend-inner-icon="verified_user"
          :rules="[rules.required, rules.match]"
          @keyup="validate"
        />
      </div>

      <v-btn
        color="primary"
        class="btn btn-primary btn-block mt-1"
        height="45"
        type="submit"
        block
        depressed
      >
        Create Account
      </v-btn>
    </v-form>

    <div v-if="error" class="mt-2 alert error--text arboria text-center">
      {{ error }}
    </div>

    <v-divider class="my-5" />

    <div class="py-2 text-center">
      <v-btn
        color="white"
        block
        height="auto"
        class="google-button mx-auto pa-3"
        @click="loginWithGoogle"
      >
        <v-avatar size="25" left>
          <v-img src="@/assets/companies/google.png" />
        </v-avatar>

        <span class="ml-4 grey--text text--darken-2">
          Sign up with Google
        </span>
      </v-btn>
    </div>

    <div class="py-2 text-center">
      <v-btn
        color="white"
        block
        height="auto"
        class="google-button mx-auto pa-3"
        @click="loginWithGitHub"
      >
        <v-avatar size="25" left>
          <v-img src="@/assets/companies/github.png" />
        </v-avatar>

        <span class="ml-4 grey--text text--darken-2">
          Sign up with GitHub
        </span>
      </v-btn>
    </div>

    <v-divider class="my-5" />

    <div class="caption mt-12 text-center d-flex align-center justify-center">
      Already have an account?
      <router-link :to="{ name: 'login' }">
        <div class="ml-1">
          Sign in
        </div>
      </router-link>
      .
    </div>
  </v-container>
</template>

<style lang="scss" scoped>
.password-hint-container {
  left: 50%;
  position: absolute;
  top: 75px;
  transform: translate(-50%);
  z-index: 1;

  .password-hint {
    position: relative;
    width: 250px;

    &::before {
      background-color: var(--v-appForeground-base);
      box-shadow: 0 0 2px -2px rgba(0, 0, 0, 0.2), 0 0 2px 0 rgba(0, 0, 0, 0.14),
        0 -1px 5px 0 rgba(0, 0, 0, 0.12);
      content: '';
      height: 36px;
      left: 50%;
      position: absolute;
      top: -18px;
      transform: translate(-50%) rotate(45deg);
      width: 36px;
      z-index: -1;
    }

    // stylelint-disable
    &::after {
      // stylelint-enable
      border: solid transparent;
      border-color: var(--v-appForeground-base);
      border-top-color: rgba(255, 255, 255, 0);
      border-width: 20px;
      bottom: 100%;
      content: ' ';
      height: 0;
      left: 50%;
      pointer-events: none;
      position: absolute;
      top: -1px;
      transform: translate(-50%);
      width: 51px;
      z-index: -1;
    }
  }
}

/*
  This is the fade transition css class overrides
*/
.hint-enter-active {
  animation: fade 150ms;
}

.hint-leave-active {
  animation: fade 150ms reverse;
}

@keyframes fade {
  0% {
    opacity: 0;
  }

  100% {
    opacity: 1;
  }
}
</style>
