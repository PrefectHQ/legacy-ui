<script>
export default {
  data() {
    return {
      model: false
    }
  }
}
</script>

<template>
  <v-menu
    v-model="model"
    offset-y
    transition="slide-y-transition"
    nudge-bottom="25"
  >
    <template #activator="{on}">
      <v-btn
        :input-value="$route.path.includes('/team/')"
        class="text-subtitle-1 text-capitalize mx-1 font-weight-medium"
        dark
        small
        depressed
        color="transparent"
        v-on="on"
      >
        Team
      </v-btn>
    </template>

    <v-sheet width="400" class="white">
      <!-- <div class="text-h6 font-weight-light px-4">
        Stuck? We can help!
      </div> -->

      <v-list>
        <v-list-item :to="{ name: 'account' }">
          <v-list-item-avatar tile>
            <i class="o-100 fad fa-abacus fa-2x" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Account
            </v-list-item-title>
            <v-list-item-subtitle>
              Manage your team's plan, profile, and data
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :to="{ name: 'members' }">
          <v-list-item-avatar tile>
            <i class="o-100 fad fa-users fa-2x" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Members
            </v-list-item-title>
            <v-list-item-subtitle>
              Invite people to your team and manage permissions
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :to="{ name: 'projects' }">
          <v-list-item-avatar tile>
            <v-icon large color="#999">
              pi-project
            </v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Projects
            </v-list-item-title>
            <v-list-item-subtitle>
              Create and modify your team's projects
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :to="{ name: 'tokens' }">
          <v-list-item-avatar tile>
            <i class="o-100 fad fa-exchange-alt fa-2x" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              API Tokens
            </v-list-item-title>
            <v-list-item-subtitle>
              Manage your team's API tokens
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :to="{ name: 'flow-groups' }">
          <v-list-item-avatar tile>
            <v-icon large color="#999">
              pi-flow
            </v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Flow Groups
            </v-list-item-title>
            <v-list-item-subtitle>
              View all your team's flows
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :to="{ name: 'cloud-hooks' }">
          <v-list-item-avatar tile>
            <i class="o-100 fad fa-clouds fa-2x" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Cloud Hooks
            </v-list-item-title>
            <v-list-item-subtitle>
              Create and modify team-wide Cloud Hooks
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :to="{ name: 'flow-concurrency' }">
          <v-list-item-avatar tile>
            <v-icon large color="#999">
              pi-flow-run
            </v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Flow Concurrency
            </v-list-item-title>
            <v-list-item-subtitle>
              Manage flow concurrency
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :to="{ name: 'task-concurrency' }">
          <v-list-item-avatar tile>
            <v-icon large color="primaryDark">
              pi-task-run
            </v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Task Concurrency
            </v-list-item-title>
            <v-list-item-subtitle>
              Manage task run concurrency
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :to="{ name: 'secrets' }">
          <v-list-item-avatar tile>
            <i class="o-100 fad fa-key-skeleton fa-2x" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Secrets
            </v-list-item-title>
            <v-list-item-subtitle>
              Create and manage team-wide Secrets used by your flows
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <!-- <v-list-item
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
        </v-list-item> -->
      </v-list>
    </v-sheet>
  </v-menu>
</template>

<style lang="scss" scoped>
$dark-grey-icon: #999;
$dark-blue-icon: var(--v-primaryDark-base);

.o-100 {
  &.svg-inline--fa {
    --fa-primary-opacity: 0.8;
    --fa-secondary-opacity: 0.8;
  }
}

.fa-abacus {
  --fa-primary-color: #{$dark-grey-icon};
  --fa-secondary-color: #{$dark-blue-icon};
}

.fa-key-skeleton {
  --fa-primary-color: #{$dark-blue-icon};
  --fa-secondary-color: #{$dark-grey-icon};
}

.fa-users {
  --fa-primary-color: #{$dark-blue-icon};
  --fa-secondary-color: #{$dark-grey-icon};
}

.fa-clouds {
  --fa-primary-color: #{$dark-blue-icon};
  --fa-secondary-color: #{$dark-grey-icon};
}

.fa-exchange-alt {
  --fa-primary-color: #{$dark-blue-icon};
  --fa-secondary-color: #{$dark-grey-icon};
}
</style>
