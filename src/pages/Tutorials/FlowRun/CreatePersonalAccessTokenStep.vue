<script>
export default {
  data() {
    return {
      error: false,
      errorMessage: null,
      loginCopied: false,
      newPersonalAccessToken: null,
      newTokenName: null,
      newTokenScope: 'USER'
    }
  },
  computed: {
    loginCommand() {
      return `prefect auth login -t ${this.newPersonalAccessToken}`
    },
    newTokenFormFilled() {
      return !!this.newTokenName && !!this.newTokenScope
    }
  },
  methods: {
    clearError() {
      this.error = false
      this.errorMessage = null
    },
    copyLoginCommand() {
      navigator.clipboard.writeText(this.loginCommand).then(() => {
        this.loginCopied = true
      })
      setTimeout(() => {
        this.loginCopied = false
      }, 2000)
    },
    async createAPIToken(variables) {
      const result = await this.$apollo.mutate({
        mutation: require('@/graphql/Tokens/create-api-token.gql'),
        variables
      })

      if (
        result?.data?.create_api_token?.id &&
        result?.data?.create_api_token?.token
      ) {
        this.newPersonalAccessToken = result.data.create_api_token.token
        this.$emit('set-token', this.newPersonalAccessToken)
      } else {
        this.error = true
        this.errorMessage = 'Something went wrong when creating a token.'
        setTimeout(() => {
          this.clearError()
        }, 4000)
      }
    }
  }
}
</script>

<template>
  <div>
    <div v-if="newPersonalAccessToken">
      <p>
        Excellent! You just generated a Personal Access token.
      </p>
      <p>
        Let's log in to Prefect Cloud using the Prefect Command Line Interface
        (CLI). The following command will authenticate you as a Prefect Cloud
        user from the CLI and store your token to your local disk:
      </p>
      <div class="position-relative mb-5">
        <kbd class="pa-1 text-break">{{ loginCommand }}</kbd>
        <v-btn
          class="position-absolute copy-button"
          x-small
          @click="copyLoginCommand"
        >
          {{ loginCopied ? 'Copied!' : 'Copy' }}
        </v-btn>
      </div>
      <p>
        When you see the words "Login successful!" in your command line, then
        feel free to move on to the next step.
      </p>
      <p>
        You can find and manage your personal access tokens on the
        <router-link :to="{ name: 'personal-access-tokens' }"
          >User > Personal Access Tokens page</router-link
        >.
      </p>
      <p> </p>
    </div>
    <div v-else>
      <p>
        Now let's log in to Prefect Cloud from the command line. Before we do
        this, we'll need to generate a Personal Access token.
      </p>
      <p>
        Personal Access (or <code>USER</code>) tokens are used to represent a
        single user and to grant access to any teams or projects the user has
        access to. You can create new tokens and manage existing tokens on the
        <router-link :to="{ name: 'personal-access-tokens' }">
          Personal Access Tokens page
        </router-link>
        of the UI.
      </p>
      <p>
        You can also create a new token here:
      </p>

      <v-text-field
        v-model="newTokenName"
        single-line
        placeholder="Token Name"
        @keyup.enter.prevent="
          !newPersonalAccessToken
            ? createAPIToken({ name: newTokenName, scope: newTokenScope })
            : ''
        "
      />

      <div>
        <v-btn
          v-disable-read-only-user="
            !newTokenFormFilled || newPersonalAccessToken !== null
          "
          color="blue"
          class="white--text"
          @click="createAPIToken({ name: newTokenName, scope: newTokenScope })"
        >
          Create
        </v-btn>
      </div>
    </div>

    <v-btn
      :class="newPersonalAccessToken ? 'mt-6' : 'mt-9'"
      color="primary"
      @click="$emit('next')"
    >
      Continue
    </v-btn>

    <v-snackbar v-model="error">
      {{ errorMessage }}
      <v-btn color="error" text @click="error = false">
        Dismiss
      </v-btn>
    </v-snackbar>
  </div>
</template>

<style lang="scss" scoped>
.position-relative {
  position: relative;
}

.position-absolute {
  position: absolute;
}

.copy-button {
  bottom: 5px;
  right: 5px;
}
</style>
