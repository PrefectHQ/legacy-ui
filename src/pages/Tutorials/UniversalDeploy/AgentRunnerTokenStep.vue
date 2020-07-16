<script>
export default {
  data() {
    return {
      agentToken: null,
      agentTokenName: '',
      agentTokenRules: [
        v => !!v || 'A name for your agent token is required',
        v =>
          (v && v.length <= 50) ||
          "The agent token's name must be less than 50 characters"
      ],
      agentTokenValid: true,
      tokenCopied: false
    }
  },
  computed: {
    agentTokenCommand() {
      return `export PREFECT__CLOUD__AGENT__AUTH_TOKEN=${this.agentToken}`
    }
  },
  methods: {
    copyToken() {
      navigator.clipboard.writeText(this.agentTokenCommand).then(() => {
        this.tokenCopied = true
      })
      setTimeout(() => {
        this.tokenCopied = false
      }, 2000)
    },
    async generateAgentToken() {
      try {
        const response = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-runner-token.gql'),
          variables: {
            name: this.agentTokenName
          }
        })

        this.agentToken = response.data.createAPIToken.token
      } catch (error) {
        this.$toasted.error(
          'The agent token could not be created. Please try again.',
          {
            action: {
              text: 'Close',
              onClick(e, toastObject) {
                toastObject.goAway(0)
              }
            },
            duration: 5000
          }
        )

        throw error
      }
    }
  }
}
</script>

<template>
  <div>
    <div v-if="!agentToken">
      <p>Our next goal is to generate an agent token.</p>

      <p>
        <a
          href="https://docs.prefect.io/cloud/agent/overview.html"
          target="_blank"
          rel="”noreferrer”"
          >Agents</a
        >
        are responsible for communicating with Prefect Cloud and submitting your
        flows for execution. Your agents will need tokens called
        <code>RUNNER</code> tokens to authenticate with Prefect Cloud. There is
        no limit to the number of agent tokens you can create.
      </p>

      <v-form
        ref="form"
        v-model="agentTokenValid"
        @submit.prevent="generateAgentToken"
      >
        <v-text-field
          v-model="agentTokenName"
          label="Agent Token Name"
          :rules="agentTokenRules"
          counter
          maxlength="50"
          @keydown.enter="generateAgentToken"
        />

        <v-btn
          class="mt-3"
          color="primary"
          :disabled="!agentTokenValid"
          @click="generateAgentToken"
        >
          Generate Agent Token
        </v-btn>
      </v-form>
    </div>

    <div v-else>
      <p>Excellent! You just created a <code>RUNNER</code> agent token.</p>
      <p>
        Run the following command to store your generated token as an
        environment variable:
      </p>

      <div class="position-relative mb-5">
        <kbd class="pa-1 text-break">{{ agentTokenCommand }}</kbd>
        <v-btn class="mt-2 float-right" x-small @click="copyToken">
          {{ tokenCopied ? 'Copied!' : 'Copy' }}
        </v-btn>
      </div>

      <p>
        Your local agent will use this variable to authenticate with Cloud.
      </p>

      <p>
        For future reference, agent tokens are managed on the
        <router-link :to="{ name: 'tokens' }"
          >Team > API Tokens page</router-link
        >.
      </p>
    </div>

    <v-btn
      color="primary"
      :class="agentToken ? 'mt-6' : 'mt-10'"
      @click="$emit('next')"
    >
      Continue
    </v-btn>
  </div>
</template>
