<script>
import ExternalLink from '@/components/ExternalLink'

export default {
  components: { ExternalLink },
  data() {
    return {
      sdkTab: 'pip'
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
          <v-card-text> </v-card-text>
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
</style>
