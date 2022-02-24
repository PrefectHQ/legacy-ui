<script>
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      model: false
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud'])
  }
}
</script>

<template>
  <v-menu
    v-model="model"
    offset-y
    offset-x
    :nudge-left="350"
    transition="slide-y-transition"
    nudge-bottom="20"
  >
    <template #activator="{ on }">
      <v-btn
        class="navbar-icon mx-1"
        :input-value="$route.path.includes('/help')"
        icon
        title="Open the help menu"
        v-on="on"
      >
        <i
          class="fad fa-question-circle nav-bar-duotone-icon fa-2x white--text"
        />
      </v-btn>
    </template>

    <v-sheet width="350" class="pt-4">
      <div class="text-h6 font-weight-light px-4">
        Stuck? We can help!
      </div>

      <v-list class="text-left">
        <v-list-item :to="'/getting-started'">
          <v-list-item-avatar tile class="d-flex justify-center align-center">
            <i class="o-100 fad fa-laptop-code fa-2x" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Getting started
            </v-list-item-title>
            <v-list-item-subtitle>
              Installing Prefect, starting your first agent and more
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item href="https://docs.prefect.io" target="_blank">
          <v-list-item-avatar tile class="d-flex justify-center align-center">
            <i class="o-100 fad fa-books fa-2x fa-flip-horizontal" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Docs
              <sup>
                <v-icon x-small>
                  open_in_new
                </v-icon>
              </sup>
            </v-list-item-title>
            <v-list-item-subtitle>
              Explore Prefect through our docs
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item href="https://discourse.prefect.io" target="_blank">
          <v-list-item-avatar tile class="d-flex justify-center align-center">
            <i class="o-100 fab fa-discourse fa-2x primaryDark--text" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Have a question?
              <sup>
                <v-icon x-small>
                  open_in_new
                </v-icon>
              </sup>
            </v-list-item-title>
            <v-list-item-subtitle>
              Start a discussion on our Discourse!
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :to="'/tutorial'">
          <v-list-item-avatar tile class="d-flex justify-center align-center">
            <i class="o-100 fad fa-graduation-cap fa-2x fa-flip-horizontal" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Tutorials
            </v-list-item-title>
            <v-list-item-subtitle>
              Learn more about Prefect, right from the UI
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          href="https://github.com/PrefectHQ/ui/issues/new/choose"
          target="_blank"
        >
          <v-list-item-avatar tile class="d-flex justify-center align-center">
            <i class="o-100 fab fa-github fa-2x primaryDark--text" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Found a bug?
              <sup>
                <v-icon x-small>
                  open_in_new
                </v-icon>
              </sup>
            </v-list-item-title>
            <v-list-item-subtitle>
              Open a ticket for us on GitHub!
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item href="https://prefect.io/slack" target="_blank">
          <v-list-item-avatar tile class="d-flex justify-center align-center">
            <img src="@/assets/icon-illustrations/slack-community.svg" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Join our Slack!
              <sup>
                <v-icon x-small>
                  open_in_new
                </v-icon>
              </sup>
            </v-list-item-title>
            <v-list-item-subtitle>
              Chat with us, ask questions, and share tips
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item v-if="isCloud" :to="'/help'">
          <v-list-item-avatar tile class="d-flex justify-center align-center">
            <i class="o-100 fad fa-life-ring fa-2x" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Feedback & Support
            </v-list-item-title>
            <v-list-item-subtitle>
              Having trouble or have a question for us?
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-sheet>
  </v-menu>
</template>

<style lang="scss" scoped>
$dark-grey-icon: var(--v-utilGrayMid-base);
$dark-blue-icon: var(--v-primaryDark-base);

.o-100 {
  &.svg-inline--fa {
    --fa-primary-opacity: 0.8;
    --fa-secondary-opacity: 0.8;
  }
}

.fa-life-ring {
  --fa-secondary-color: #{$dark-grey-icon};
  --fa-primary-color: #{$dark-blue-icon};
}

.fa-books {
  --fa-primary-color: #{$dark-grey-icon};
  --fa-secondary-color: #{$dark-blue-icon};
}

.fa-graduation-cap {
  --fa-secondary-color: #{$dark-blue-icon};
  --fa-primary-color: #{$dark-grey-icon};
}

.fa-laptop-code {
  --fa-secondary-color: #{$dark-blue-icon};
  --fa-primary-color: #{$dark-grey-icon};
}
</style>
