<script>
// import MenuLink from '@/components/Nav/MenuLink'

export default {
  //   components: { MenuLink },
  data() {
    return {
      model: false
    }
  },
  computed: {
    routes() {
      return [
        {
          text: 'Getting Started',
          route: {
            name: 'home'
          }
        }
      ]
    }
  }
}
</script>

<template>
  <v-menu
    v-model="model"
    :close-on-content-click="false"
    offset-y
    offset-x
    :nudge-left="350"
    transition="slide-y-transition"
    nudge-bottom="20"
  >
    <template #activator="{ on }">
      <v-btn class="navbar-icon mx-1" icon v-on="on">
        <i
          class="fad fa-question-circle nav-bar-duotone-icon fa-2x white--text"
        />
      </v-btn>
    </template>

    <v-sheet width="350" class="white pt-4">
      <div class="text-h6 font-weight-light px-4">
        Stuck? We can help!
      </div>

      <v-list>
        <v-list-item href="https://docs.prefect.io" target="_blank">
          <v-list-item-avatar tile>
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

        <v-list-item
          href="https://join.slack.com/t/prefect-community/shared_invite/enQtODQ3MTA2MjI4OTgyLTliYjEyYzljNTc2OThlMDE4YmViYzk3NDU4Y2EzMWZiODM0NmU3NjM0NjIyNWY0MGIxOGQzODMxNDMxYWYyOTE"
          target="_blank"
        >
          <v-list-item-avatar tile>
            <i class="o-100 fab fa-github fa-2x grey--text text--darken-2" />
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

        <v-list-item
          href="https://join.slack.com/t/prefect-community/shared_invite/enQtODQ3MTA2MjI4OTgyLTliYjEyYzljNTc2OThlMDE4YmViYzk3NDU4Y2EzMWZiODM0NmU3NjM0NjIyNWY0MGIxOGQzODMxNDMxYWYyOTE"
          target="_blank"
        >
          <v-list-item-avatar tile>
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

        <v-list-item :to="{ name: 'help' }">
          <v-list-item-avatar tile>
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
.o-100 {
  &.svg-inline--fa {
    --fa-primary-opacity: 0.8;
    --fa-secondary-opacity: 0.8;
  }
}

.fa-life-ring {
  --fa-primary-color: #efefef;
  --fa-secondary-color: #ff4c4c;
}

.fa-books {
  --fa-primary-color: #efefef;
  --fa-secondary-color: #0075b8;
}
</style>
