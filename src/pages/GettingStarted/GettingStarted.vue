<script>
// Infrastructure components
import ConnectAgentSection from '@/pages/GettingStarted/ConnectAgent-Section'
import CreateTenantSection from '@/pages/GettingStarted/CreateTenant-Section'
import StartPrefectServerSection from '@/pages/GettingStarted/StartPrefectServer-Section'

import ExternalLink from '@/components/ExternalLink'
import { mapGetters } from 'vuex'

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
    href: 'https://prefect.io/slack',
    linkText: 'Join Slack'
  }
]

export default {
  components: {
    CreateTenantSection,
    ConnectAgentSection,
    ExternalLink,
    StartPrefectServerSection
  },
  data() {
    return {
      exploreBlocks: exploreBlocks,
      gettingStartedTab: 'infrastructure',
      sdkTab: 'pip'
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud', 'connected', 'isServer']),
    ...mapGetters('tenant', ['tenantIsSet'])
  },
  watch: {
    connected(val) {
      if (val) {
        // sets the default tab displayed
        if (this.isCloud) {
          this.gettingStartedTab = 'agent'
        } else if (!this.tenantIsSet) {
          this.gettingStartedTab = 'tenant'
        } else {
          this.gettingStartedTab = 'agent'
        }
      }
    }
  },
  mounted() {
    // sets the default tab displayed
    if (this.isCloud) {
      this.gettingStartedTab = 'agent'
    } else if (!this.connected) {
      this.gettingStartedTab = 'infrastructure'
    } else if (!this.tenantIsSet) {
      this.gettingStartedTab = 'tenant'
    } else {
      this.gettingStartedTab = 'agent'
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
        <div class="text-h2 text-center mb-2">Welcome to your Prefect UI!</div>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card tile>
          <v-card-title>
            Getting started with Prefect
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
            <v-tabs
              v-model="gettingStartedTab"
              :background-color="isCloud ? 'primary' : 'secondary'"
            >
              <v-tab v-if="isServer" ref="infrastructure" href="#infrastructure"
                >Prefect Server</v-tab
              >
              <v-tab v-if="isServer && !tenantIsSet" ref="tenant" href="#tenant"
                >Creating a tenant</v-tab
              >
              <v-tab ref="agent" href="#agent">Connecting an Agent</v-tab>
            </v-tabs>

            <div class="pa-5">
              <v-tabs-items v-model="gettingStartedTab">
                <v-tab-item value="infrastructure">
                  <StartPrefectServerSection />
                </v-tab-item>

                <v-tab-item v-if="isServer" value="tenant">
                  <CreateTenantSection />
                </v-tab-item>

                <v-tab-item value="agent">
                  <ConnectAgentSection />
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
            Getting the Prefect SDK
          </v-card-title>
          <v-card-text>
            <div class="text-body-1">
              <ExternalLink href="https://docs.prefect.io">
                <div class="d-inline-flex align-start justify-start">
                  <v-icon class="mr-2" small>fas fa-align-left</v-icon>
                  <div>View the documentation</div>
                </div>
              </ExternalLink>

              <ExternalLink href="https://github.com/PrefectHQ/prefect">
                <div class="d-inline-flex align-start justify-start ml-6">
                  <v-icon class="mr-2" small>fab fa-github</v-icon>
                  <div>Visit GitHub </div>
                </div>
              </ExternalLink>
            </div>

            <div class="text-body-1 mt-2">
              Get the Prefect Core package and start building!
            </div>

            <v-tabs
              v-model="sdkTab"
              class="mt-4"
              background-color="primary"
              style="border: 1px solid utilGrayLight !important;
                border-bottom: unset !important;"
            >
              <v-tab key="pip">Pip</v-tab>
              <v-tab key="conda">Conda</v-tab>
              <v-tab key="pipenv">Pipenv</v-tab>
            </v-tabs>

            <div
              class="text-body-1 appBackground utilGrayDark--text rounded-sm pa-5 code-block"
              style="border: 1px solid var(--v-utilGrayLight-base) !important;
                border-top: unset !important;"
            >
              <v-tabs-items v-model="sdkTab">
                <v-tab-item key="pip">
                  <div class="">
                    <span class="utilGrayMid--text user-select-none">$ </span
                    >pip
                    <span class="primary--text font-weight-medium"
                      >install</span
                    >
                    prefect
                  </div>
                </v-tab-item>

                <v-tab-item key="conda">
                  <div class="">
                    <span class="utilGrayMid--text user-select-none">$ </span
                    >conda
                    <span class="primary--text font-weight-medium"
                      >install</span
                    >
                    -c conda-forge prefect
                  </div>
                </v-tab-item>

                <v-tab-item key="pipenv">
                  <div class="">
                    <span class="utilGrayMid--text user-select-none">$ </span
                    >pipenv
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
.explore-image {
  height: 125px;
  max-width: 125px;
}
</style>
