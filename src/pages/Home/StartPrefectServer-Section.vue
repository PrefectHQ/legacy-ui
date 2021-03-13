<script>
import ExternalLink from '@/components/ExternalLink'
import { mapGetters, mapActions, mapMutations } from 'vuex'

export default {
  components: {
    ExternalLink
  },
  data() {
    return {
      defaultUrl:
        window.prefect_ui_settings?.server_url ||
        process.env.VUE_APP_SERVER_URL,
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
    ...mapActions('api', ['getApi']),
    ...mapActions('tenant', ['updateTenantSettings']),
    ...mapMutations('api', ['setServerUrl', 'unsetServerUrl']),
    _handleKeyup() {
      this.success = false
      this.error = false
      this.loading = false
    },
    async _resetUrl() {
      this.unsetServerUrl()

      this.urlInput = this.defaultUrl

      this.error = false
      this.success = false
      this.connected = false

      this.setServerUrl(this.defaultUrl)
    },
    async _testUrl() {
      this.success = false
      this.error = false
      this.loading = true

      try {
        this.setServerUrl(this.urlInput)
        await this.getApi()

        this.success = this.connected
        this.error = !this.success
      } catch {
        this.error = true
        this.success = false
        this.connected = false
      }
      this.loading = false
    }
  }
}
</script>

<template>
  <div class="appForeground">
    <div class="text-body-1">
      Before you can begin to schedule work with
      <ExternalLink
        href="https://docs.prefect.io/orchestration/server/overview.html"
      >
        Prefect Server
      </ExternalLink>
      , you'll need to start the orchestration infrastructure required to manage
      your Flows. This includes a database, API, scheduler, and various other
      criticial services. Alternatively, you can use Prefect Cloud and get
      started right away (it's free!)
    </div>

    <ol class="mt-6">
      <li class="text-h6">Start Prefect Server</li>
      <div class="text-body-1 mt-2">
        Once you've installed the Prefect Python package, this simple CLI
        command starts up the various containers that make up Prefect Server.
        Note that you'll need to have
        <ExternalLink href="https://docs.docker.com/get-started/">
          Docker
        </ExternalLink>
        running.
      </div>

      <div
        class="text-body-1 grey lighten-5 blue-grey--text text--darken-2 rounded-sm pa-3 mt-4"
        style="border: 1px solid var(--v-utilGrayLight-base) !important;"
      >
        <div class="code-block">
          <span class="blue-grey--text text--lighten-1 user-select-none"
            >$
          </span>
          <span class="primary--text font-weight-medium">prefect</span>
          server <span class="deepRed--text font-weight-medium">start</span>
        </div>
      </div>
      <div class="text-body-1 mt-2">
        This command has many options to customize your deployment - run it with
        the <kbd>-h</kbd> flag to see the documentation!
      </div>
    </ol>

    <ol class="mt-12">
      <li value="2" class="text-h6">Connect the UI</li>
      <div class="text-body-1 mt-2">
        The GraphQL endpoint is one of the public URLs exposed by Prefect Server
        that allows interaction with the API. By default it's exposed at
        <kbd>http://localhost:4200/graphql</kbd>, but this can be modified. You
        can directly modify this endpoint in the input box below:
      </div>

      <div
        class="d-flex align-end justify-start text-h5 utilGrayDark--text mt-6 mb-10"
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
          <template #append>
            <v-tooltip top>
              <template #activator="{ on }">
                <div class="mb-2">
                  <v-fade-transition mode="out-in">
                    <v-icon v-if="success" key="success" color="green">
                      check
                    </v-icon>
                    <v-icon v-else-if="error" key="error" color="error">
                      error
                    </v-icon>
                  </v-fade-transition>

                  <v-btn
                    color="blue-grey lighten-1"
                    icon
                    small
                    @click="_resetUrl"
                    v-on="on"
                  >
                    <v-icon key="reset" color="grey">
                      settings_backup_restore
                    </v-icon>
                  </v-btn>
                </div>
              </template>
              <span>
                Reset stored GraphQL endpoint
              </span>
            </v-tooltip>
          </template>

          <template #append-outer>
            <div>
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

      <div class="text-body-1 mt-2">
        ...or by setting <kbd>apollo_url</kbd> in
        <kbd>./prefect/config.toml</kbd> on whatever machine you're running
        Prefect Server:
      </div>
      <div
        class="text-body-1 grey lighten-5 blue-grey--text text--darken-2 rounded-sm pa-3 mt-4"
        style="border: 1px solid var(--v-utilGrayLight-base) !important;"
      >
        <div class="code-block">
          <pre>
[server]
  [server.ui]
    apollo_url="http://localhost:4200/graphql"
          </pre>
        </div>
      </div>
      <div class="text-body-1 mt-2">
        Note: The second method will change the default Apollo endpoint but can
        still be overidden by the input box above.
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
        Next you'll want to connect an
        <ExternalLink
          href="https://docs.prefect.io/orchestration/agents/overview.html"
        >
          Agent </ExternalLink
        >, which is responsible for executing your workflows.
      </div>
    </ol>
  </div>
</template>

<style lang="scss" scoped>
/* stylelint-disable-next-line */
.v-input__append-inner {
  margin-top: 0 !important;
}
</style>
