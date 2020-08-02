<script>
import ExternalLink from '@/components/ExternalLink'
import { mapGetters, mapActions } from 'vuex'

export default {
  components: {
    ExternalLink
  },
  data() {
    return {
      error: false,
      loading: false,
      success: false,
      urlInput: null
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud', 'url', 'serverUrl', 'connected'])
  },
  methods: {
    ...mapActions('api', ['setServerUrl', 'getApi']),
    ...mapActions('tenant', ['updateTenantSettings']),
    _handleKeyup() {
      this.success = false
      this.error = false
      this.loading = false
    },
    async _testUrl() {
      this.success = false
      this.error = false
      this.loading = true

      try {
        await this.setServerUrl(this.urlInput)
        await this.getApi()

        this.success = this.connected
      } catch (e) {
        this.error = true
      }
      this.loading = false
    }
  }
}
</script>

<template>
  <div>
    <div class="text-body-1">
      Before you can begin to schedule work with Prefect Server, you'll need to
      start the orchestration infrastructure required to manage your Flows. This
      includes a database, API, scheduler, and various other criticial services.
      Alternatively, you can use the Prefect Cloud and get started right away
      (it's free!)
    </div>

    <ol class="mt-6">
      <li class="text-h6">Start Prefect Server</li>
      <div class="text-body-1 mt-2">
        This command starts up the various containers that make up Prefect
        Server. Note that you'll need to have
        <ExternalLink href="https://docs.docker.com/get-started/">
          Docker
        </ExternalLink>
        running.
      </div>

      <div
        class="text-body-1 grey lighten-5 blue-grey--text text--darken-2 rounded-sm pa-3 mt-4"
        style="border: 1px solid #b0bec5 !important;"
      >
        <div class="code-block">
          <span class="blue-grey--text text--lighten-1 user-select-none"
            >$
          </span>
          <span class="primary--text font-weight-medium">prefect</span>
          server start
        </div>
      </div>
    </ol>

    <ol class="mt-12">
      <li value="2" class="text-h6">Connect the UI</li>
      <div class="text-body-1 mt-2">
        The GraphQL endpoint is one of the public URLs exposed by Prefect Server
        that allows interaction with the API. By default it's exposed at
        <kbd>localhost:4200/graphql</kbd>, but you can modify this and other
        settings from your Server's <kbd>~/.prefect/config.toml</kbd>.
      </div>

      <div
        class="d-flex align-end justify-start text-h5 blue-grey--text text--darken-2 mt-10"
      >
        <div>Prefect Server GraphQL endpoint:</div>
        <v-text-field
          v-model="urlInput"
          class="text-h5 mx-2"
          outlined
          dense
          hide-details
          :placeholder="serverUrl || 'http://localhost:4200/graphql'"
          :style="{ 'max-width': '500px' }"
          :disabled="loading"
          @keyup="_handleKeyup"
        >
          <template v-slot:append>
            <v-fade-transition mode="out-in">
              <v-icon v-if="success" key="success" color="green">
                check
              </v-icon>
              <v-icon v-else-if="error" key="error" color="error">
                error
              </v-icon>
            </v-fade-transition>
          </template>

          <template v-slot:append-outer>
            <div class="mt-n1">
              <v-btn
                color="primary"
                dark
                small
                depressed
                :loading="loading"
                @click="_testUrl"
              >
                Connect
              </v-btn>
            </div>
          </template>
        </v-text-field>
      </div>

      <v-scroll-y-transition mode="out-in">
        <div v-if="success" key="success" class="success--text mt-2">
          Success! You've successfully connected to your Prefect Server.
        </div>
        <div v-else-if="error" key="error" class="error--text mt-2">
          Oops! It looks like something went wrong when trying to connect; make
          sure Prefect Server is running at the URL above and try again.
        </div>
      </v-scroll-y-transition>
    </ol>

    <ol class="mt-12">
      <li value="3" class="text-h6 mt-6 mb-2">Register an Agent</li>
      <div class="text-body-1">
        Next you'll want to register an
        <ExternalLink
          href="https://docs.prefect.io/orchestration/agents/overview.html"
        >
          Agent </ExternalLink
        >, which is responsible for executing your workflows.
      </div>
    </ol>
  </div>
</template>
