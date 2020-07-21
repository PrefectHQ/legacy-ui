<script>
import ExternalLink from '@/components/ExternalLink'
import { mapGetters } from 'vuex'
import { createApolloClient } from 'vue-cli-plugin-apollo/graphql-client'
import { defaultOptions } from '@/vue-apollo'

const exploreBlocks = [
  {
    headline: 'Read Case Studies',
    body: 'Learn how our customers build on Prefect',
    src: require('@/assets/icon-illustrations/tangible-investment.svg'),
    alt: 'Case studies image',
    href: 'https://www.prefect.io/why-prefect/case-studies',
    linkText: 'Read Case Studies'
  },
  {
    headline: 'Explore the Docs',
    body: 'Get API references, walkthroughs, and tutorials',
    src: require('@/assets/icon-illustrations/read-the-blog.svg'),
    alt: 'Explore the docs image',
    href: 'https://docs.prefect.io',
    linkText: 'Get the Docs'
  },
  {
    headline: 'Join our Community',
    body: 'Chat with us, ask questions, and share tips',
    src: require('@/assets/icon-illustrations/slack-community.svg'),
    alt: 'Join the community image',
    href:
      'https://join.slack.com/t/prefect-community/shared_invite/enQtODQ3MTA2MjI4OTgyLTliYjEyYzljNTc2OThlMDE4YmViYzk3NDU4Y2EzMWZiODM0NmU3NjM0NjIyNWY0MGIxOGQzODMxNDMxYWYyOTE',
    linkText: 'Join Slack'
  }
]

export default {
  components: { ExternalLink },
  data() {
    return {
      exploreBlocks: exploreBlocks,
      gettingStartedTab: this.isCloud ? 'agent' : 'infrastructure',
      sdkTab: 'pip',
      serverUrl: 'http://localhost:4200/graphql'
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud'])
  },
  mounted() {
    console.log(defaultOptions)
  },
  methods: {
    async _testUrl() {
      console.log('testing')
      const apolloClient = createApolloClient({
        ...defaultOptions,
        httpEndpoint: () => this.serverUrl
      }).apolloClient

      console.log(apolloClient)
      // try {
      const data = await apolloClient.query({
        query: require('@/graphql/hello.gql')
      })
      console.log(data)
      // } catch (e) {
      //   console.log(e)
      // }
    }
  }
}
</script>

<template>
  <v-container
    fluid
    style="max-width: 1000px !important;"
    class="mx-auto pt-0 px-3 pb-12"
  >
    <v-row class="mt-8">
      <v-col>
        <div class="text-h2 text-center">Welcome to your Prefect UI</div>
        <div
          class="text-body-1 text-center my-2 mx-auto"
          style="max-width: 600px;"
        >
          This is the command center for your workflows; deploy from Prefect
          Core and instantly gain complete oversight and control.
        </div>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card tile>
          <v-card-title>
            Explore the possibilities with Prefect
          </v-card-title>
          <v-card-text>
            <v-row justify="center">
              <v-col
                v-for="(block, i) in exploreBlocks"
                :key="i"
                class="d-flex flex-column text-center"
                cols="12"
                sm="6"
                md="4"
              >
                <div>
                  <img
                    class="explore-image"
                    :src="block.src"
                    :alt="block.alt"
                  />
                </div>

                <div class="text-h6">
                  {{ block.headline }}
                </div>
                <div class="text-body-2 mb-4">
                  {{ block.body }}
                </div>
                <div>
                  <v-btn
                    color="accentOrange"
                    dark
                    depressed
                    small
                    target="_blank"
                    :href="block.href"
                  >
                    {{ block.linkText }}
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card tile>
          <v-card-title>
            Connecting your infrastructure
          </v-card-title>
          <v-card-text>
            <div class="text-body-1"> </div>

            <v-tabs
              v-model="gettingStartedTab"
              :background-color="isCloud ? 'primary' : 'secondary'"
              dark
            >
              <v-tab key="infrastructure">Prefect Server</v-tab>
              <v-tab key="agent">Connecting an Agent</v-tab>
            </v-tabs>

            <div class="pa-5">
              <v-tabs-items
                v-model="gettingStartedTab"
                background-color="white"
              >
                <v-tab-item key="infrastructure" class="white">
                  <div class="text-body-1">
                    Before you can begin to schedule work with Prefect Server,
                    you'll need to start the orchestration infrastructure
                    required to manage your Flows. This includes a database,
                    API, scheduler, and various other criticial services.
                    Alternatively, you can use the Prefect Cloud and get started
                    right away (it's free!)
                  </div>

                  <div class="text-h6 mt-6 mb-2">1. Start Prefect Server</div>
                  <div
                    class="text-body-1 grey lighten-5 blue-grey--text text--darken-2 rounded-sm pa-3 code-block"
                    style="border: 1px solid #b0bec5 !important;"
                  >
                    <div class="">
                      <span class="blue-grey--text text--lighten-1">$</span>
                      <span class="primary--text font-weight-medium">
                        prefect</span
                      >
                      server start
                    </div>
                  </div>

                  <div class="text-h6 mt-6 mb-2">2. Connect the UI</div>
                  <div
                    class="d-flex align-end justify-start text-h5 blue-grey--text text--darken-2"
                  >
                    <div>Prefect Server GraphQL endpoint:</div>
                    <v-text-field
                      v-model="serverUrl"
                      class="text-h5 mx-2"
                      outlined
                      dense
                      hide-details
                      placeholder="http://localhost:4200/graphql"
                      :style="{ 'max-width': '400px' }"
                    >
                      <template v-slot:append-outer>
                        <v-btn
                          color="accentOrange"
                          class="mt-n1"
                          dark
                          small
                          depressed
                          @click="_testUrl"
                        >
                          Test
                        </v-btn>
                      </template>
                    </v-text-field>
                  </div>

                  <div> </div>
                </v-tab-item>
              </v-tabs-items>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card tile>
          <v-card-title>
            Prefect SDK
          </v-card-title>
          <v-card-text>
            <div class="text-body-1">
              <ExternalLink href="https://docs.prefect.io">
                <div class="d-inline-flex align-start justify-start">
                  <v-icon class="mr-2" small>fas fa-align-left</v-icon>
                  <div>View the documentation</div>
                </div>
              </ExternalLink>

              <ExternalLink href="https://docs.prefect.io">
                <div class="d-inline-flex align-start justify-start ml-6">
                  <v-icon class="mr-2" small>fab fa-github</v-icon>
                  <div>Visit GitHub</div>
                </div>
              </ExternalLink>
            </div>

            <v-tabs
              v-model="sdkTab"
              background-color="cloudUIPrimaryBlue primary"
              dark
              class="mt-4"
              style="border: 1px solid #b0bec5 !important;
                border-bottom: unset !important;"
            >
              <v-tab key="pip">Pip</v-tab>
              <v-tab key="conda">Conda</v-tab>
              <v-tab key="pipenv">Pipenv</v-tab>
            </v-tabs>

            <div
              class="text-body-1 grey lighten-5 blue-grey--text text--darken-2 rounded-sm pa-5 code-block"
              style="border: 1px solid #b0bec5 !important;
                border-top: unset !important;"
            >
              <v-tabs-items v-model="sdkTab">
                <v-tab-item key="pip">
                  <div class="">
                    <span class="blue-grey--text text--lighten-1">$</span> pip
                    <span class="primary--text font-weight-medium"
                      >install</span
                    >
                    prefect
                  </div>
                </v-tab-item>

                <v-tab-item key="conda">
                  <div class="">
                    <span class="blue-grey--text text--lighten-1">$</span> conda
                    <span class="primary--text font-weight-medium"
                      >install</span
                    >
                    -c conda-forge prefect
                  </div>
                </v-tab-item>

                <v-tab-item key="pipenv">
                  <div class="">
                    <span class="blue-grey--text text--lighten-1">$</span>
                    pipenv
                    <span class="primary--text font-weight-medium"
                      >install</span
                    >
                    --pre prefect
                  </div>
                </v-tab-item>
              </v-tabs-items>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
.code-block {
  font-family: 'Source Code Pro', monospace !important;
  white-space: pre-wrap;
}

.explore-image {
  height: 125px;
  max-width: 125px;
}
</style>
