<script>
import ExternalLink from '@/components/ExternalLink'

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
      sdkTab: 'pip',
      exploreBlocks: exploreBlocks
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
        <div class="text-h2 text-center">Welcome to Prefect</div>
        <div
          class="text-body-1 text-center my-2 mx-auto"
          style="max-width: 600px;"
        >
          This your command center for your workflows; deploy from Prefect Core
          and instantly gain complete oversight and control.
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
            <v-row>
              <v-col
                v-for="(block, i) in exploreBlocks"
                :key="i"
                class="d-flex flex-column text-center"
                cols="12"
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
            Connect your API
          </v-card-title>
          <v-card-text>
            Something about connection here
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
                  <div>GitHub</div>
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
