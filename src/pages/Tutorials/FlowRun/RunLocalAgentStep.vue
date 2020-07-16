<script>
export default {
  props: {
    agentTokenProp: {
      default: '',
      type: String
    }
  },
  data() {
    return {
      agentToken: null,
      agentTokenName: null,
      agentTokenValidationRules: [
        v => !!v || 'Name is required',
        v => (v && v.length <= 50) || 'Name must be less than 50 characters'
      ],
      agentCommandCopied: false,
      valid: false
    }
  },
  computed: {
    agentCommand() {
      return `prefect agent start docker -t ${this.agentTokenProp}`
    }
  },
  methods: {
    copyAgentCommand() {
      navigator.clipboard.writeText(this.agentCommand).then(() => {
        this.agentCommandCopied = true
      })
      setTimeout(() => {
        this.agentCommandCopied = false
      }, 2000)
    },
    async generateAgentToken() {
      if (!this.agentTokenName || this.agentTokenName.length < 3) return

      try {
        const name = this.agentTokenName
        const response = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-runner-token.gql'),
          variables: {
            name
          }
        })

        this.agentToken = response.data.create_api_token.token
        this.$emit('agent-token-generated', this.agentToken)
      } catch (error) {
        this.$toasted.error('Failed to generate agent token', {
          action: {
            text: 'Close',
            onClick(e, toastObject) {
              toastObject.goAway(0)
            }
          },
          duration: 5000
        })

        throw error
      }
    }
  }
}
</script>

<template>
  <div>
    <div v-if="agentTokenProp">
      <p>
        Excellent! Now that we've created our token, let's start a Prefect
        Agent. This agent will immediately begin looking for scheduled work from
        Prefect Cloud. Start your agent with the following command:
      </p>
      <div class="position-relative">
        <kbd class="pa-1 text-break">{{ agentCommand }}</kbd>
        <v-btn
          class="position-absolute copy-button"
          x-small
          @click="copyAgentCommand"
        >
          {{ agentCommandCopied ? 'Copied!' : 'Copy' }}
        </v-btn>
      </div>
      <br />
      <p>
        If you see the error message "docker is not a valid agent", you are
        probably running an older version of Prefect Core. You can either
        upgrade your package or alter the above command to
        <code>prefect agent start -t TOKEN</code>
      </p>
    </div>
    <div v-else>
      Our next goal is to get a
      <a href="https://docs.prefect.io/cloud/agent/docker.html" target="_blank"
        >Docker agent</a
      >
      up and running. Agents are responsible for communicating with Prefect
      Cloud and submitting your Flows for execution. Your agents will also need
      tokens (called <code>RUNNER</code> tokens) for authenticating with Prefect
      Cloud, and as before there is no limit to the number of tokens you can
      create. Agent tokens can be managed on the Team > API Tokens page of the
      UI.
      <br />
      <v-form ref="form" v-model="valid" @submit.prevent="generateAgentToken">
        <v-text-field
          v-model="agentTokenName"
          :rules="agentTokenValidationRules"
          :counter="50"
          label="Agent Token Name"
          @keydown.enter="generateAgentToken"
        />
      </v-form>
      <br />
      <v-btn color="primary" :disabled="!valid" @click="generateAgentToken">
        Generate Agent Token
      </v-btn>
    </div>
    <v-btn color="primary" class="mt-12" @click="$emit('next')">
      Continue
    </v-btn>
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
