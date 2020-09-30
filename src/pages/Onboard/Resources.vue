<script>
export default {
  data() {
    return {
      showDashboardNavigation: false,
      showResources: false
    }
  },
  computed: {
    slashClass() {
      return {
        slash: this.$vuetify.breakpoint.mdAndUp,
        'slash-horizontal': this.$vuetify.breakpoint.smAndDown,
        'slash-lg': this.$vuetify.breakpoint.lgAndUp,
        // 'slash-shadow': this.$vuetify.breakpoint.mdAndUp,
        'slash-transition': this.showResources,
        'text-center': this.$vuetify.breakpoint.smAndDown
      }
    }
  },
  mounted() {
    setTimeout(() => {
      this.showResources = true
    }, 250)

    setTimeout(() => {
      this.showDashboardNavigation = true
    }, 1250)
  }
}
</script>

<template>
  <v-container class="pa-0 h-100 fill-height" style="max-width: 2560px;" fluid>
    <v-row v-if="$vuetify.breakpoint.mdAndUp">
      <v-slide-x-transition>
        <v-col v-if="showResources" cols="12" md="5" class="pl-0">
          <div
            class="d-flex align-center justify-center white--text fill-height"
            style="width: 100%;"
          >
            <div class="d-flex flex-column slash-body">
              <div class="mb-8">
                <img
                  class="photo"
                  src="@/assets/backgrounds/cloud-instructs.svg"
                  alt="Support Image"
                />
              </div>
              <div class="display-2 font-weight-medium">
                Explore the Docs
              </div>
              <div class="headline my-6">
                Get API references, walkthroughs, and tutorials
              </div>
              <div>
                <v-btn
                  color="accentPink"
                  dark
                  target="_blank"
                  href="https://docs.prefect.io"
                >
                  Prefect Docs
                </v-btn>
              </div>
            </div>
          </div>
        </v-col>
      </v-slide-x-transition>

      <v-col class="d-flex align-center justify-center" cols="12" md="2">
        <transition name="fade">
          <v-btn
            v-if="showDashboardNavigation"
            :to="{ name: 'dashboard' }"
            data-cy="go-to-dashboard"
            class="dashboard-link-absolute"
            color="primary"
            x-large
          >
            To the dashboard!
            <v-icon right>fas fa-rocket</v-icon>
          </v-btn>
        </transition>
      </v-col>

      <v-slide-x-reverse-transition>
        <v-col v-if="showResources" cols="12" md="5" class="pr-0">
          <div
            class="d-flex align-center justify-center fill-height"
            style="width: 100%;"
          >
            <div class="d-flex flex-column slash-body white--text">
              <div class="display-2 font-weight-medium">
                Join our Community
              </div>
              <div class="headline my-6">
                Chat with us, ask questions, and share tips
              </div>
              <div>
                <v-btn
                  color="white"
                  target="_blank"
                  href="https://join.slack.com/t/prefect-community/shared_invite/enQtODQ3MTA2MjI4OTgyLTliYjEyYzljNTc2OThlMDE4YmViYzk3NDU4Y2EzMWZiODM0NmU3NjM0NjIyNWY0MGIxOGQzODMxNDMxYWYyOTE"
                >
                  Join Slack
                </v-btn>
              </div>
              <div class="mt-8">
                <img
                  class="photo"
                  src="@/assets/backgrounds/join-our-community.svg"
                  alt="Support Image"
                />
              </div>
            </div>
          </div>
        </v-col>
      </v-slide-x-reverse-transition>
    </v-row>

    <v-container
      v-else
      fluid
      class="pa-0 d-flex align-content-space-between flex-column"
      style="min-height: 100%;"
    >
      <div class="display-1 white--text my-2 title-absolute text-center">
        You're all set!
      </div>

      <v-row class="flex-grow-1" no-gutters>
        <v-col class="d-flex align-center justify-center pa-0 " cols="12">
          <v-carousel
            height="100%"
            hide-delimiters
            show-arrows
            show-arrows-on-hover
            cycle
            continuous
          >
            <v-carousel-item :key="'resources'">
              <v-sheet
                height="100%"
                class="text-center gradient-background orange--gradient d-flex align-center justify-center "
              >
                <div class="d-flex flex-column z-1">
                  <div class="mb-8">
                    <img
                      class="photo mx-auto"
                      src="@/assets/backgrounds/join-our-community.svg"
                      alt="Support Image"
                      style="width: 65%;"
                    />
                  </div>
                  <div class="display-1 font-weight-medium">
                    Join our Community
                  </div>
                  <div class="subtitle-1 my-6">
                    Chat with us, ask questions, and share tips
                  </div>

                  <div>
                    <v-btn
                      color="white"
                      light
                      depressed
                      target="_blank"
                      href="https://join.slack.com/t/prefect-community/shared_invite/enQtODQ3MTA2MjI4OTgyLTliYjEyYzljNTc2OThlMDE4YmViYzk3NDU4Y2EzMWZiODM0NmU3NjM0NjIyNWY0MGIxOGQzODMxNDMxYWYyOTE"
                    >
                      Join Slack
                    </v-btn>
                  </div>
                </div>
              </v-sheet>
            </v-carousel-item>

            <v-carousel-item :key="'docs'">
              <v-sheet
                height="100%"
                class="text-center gradient-background grey--gradient d-flex align-center justify-center"
              >
                <div class="d-flex flex-column align white--text z-1">
                  <div class="mb-8">
                    <img
                      class="photo mx-auto"
                      src="@/assets/backgrounds/cloud-instructs.svg"
                      alt="Support Image"
                      style="width: 65%;"
                    />
                  </div>
                  <div class="display-1 font-weight-medium">
                    Explore the Docs
                  </div>
                  <div class="subtitle-1 my-6">
                    Get API references, walkthroughs, and tutorials
                  </div>
                  <div>
                    <v-btn
                      color="accentPink"
                      dark
                      depressed
                      target="_blank"
                      href="https://docs.prefect.io"
                    >
                      Prefect Docs
                    </v-btn>
                  </div>
                </div>
              </v-sheet>
            </v-carousel-item>
          </v-carousel>
        </v-col>
      </v-row>

      <v-row
        class="position-absolute dashboard-button-row-small mx-auto"
        no-gutters
      >
        <v-col cols="12" class="text-center py-2">
          <v-btn
            :to="{ name: 'dashboard' }"
            class="mx-auto"
            color="primary"
            x-large
          >
            To the dashboard!
            <v-icon right>fas fa-rocket</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<style lang="scss" scoped>
.dashboard-button-absolute {
  bottom: 5vh;
  left: 50%;
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.dashboard-button-row-small {
  bottom: 10px;
  left: 50%;
  transform: translate(-50%);
}

.title-absolute {
  left: 50%;
  position: absolute;
  top: 25px;
  transform: translate(-50%);
  z-index: 2;
}

.gradient-background {
  position: relative;

  &::before {
    content: '';
    height: 100%;
    position: absolute;
    transform-origin: inherit;
    transform-origin: 50% 50%;
    transition-delay: inherit !important;
    transition-duration: 500ms;
    transition-property: all;
    width: 100%;
    z-index: 0;
  }

  &.orange--gradient::before {
    background-image: linear-gradient(105deg, #ff60de, #ff4d20) !important;
  }

  &.grey--gradient::before {
    background-image: linear-gradient(105deg, #647489, #2f383f) !important;
  }
}
</style>
