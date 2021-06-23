<script>
import { mapGetters } from 'vuex'
import UpgradeBadge from '@/components/UpgradeBadge'

export default {
  components: {
    UpgradeBadge
  },
  data() {
    return {
      model: false
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('license', ['hasPermission'])
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
        title="Open the team menu"
        v-on="on"
      >
        Team
      </v-btn>
    </template>

    <v-sheet width="400" class="white">
      <v-list>
        <v-list-item :to="'/team/account'">
          <v-list-item-avatar tile>
            <i class="o-100 fad fa-abacus fa-2x" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Account
            </v-list-item-title>
            <v-list-item-subtitle v-if="isCloud">
              Manage your team's plan, profile, and data
            </v-list-item-subtitle>
            <v-list-item-subtitle v-else>
              Manage your team's profile and data
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :disabled="!isCloud" :to="'/team/tokens'">
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

        <v-list-item :to="'/team/cloud-hooks'">
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

        <v-list-item :disabled="!isCloud" :to="'/team/flow-concurrency'">
          <v-list-item-avatar tile>
            <v-icon large color="navIcons">
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

        <v-list-item :to="'/team/flow-groups'">
          <v-list-item-avatar tile>
            <v-icon large color="navIcons">
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

        <v-list-item :disabled="!isCloud" :to="'/team/members'">
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

        <v-list-item
          :disabled="!isCloud || !hasPermission('feature', 'custom-role')"
          :to="'/team/roles'"
        >
          <v-list-item-avatar tile>
            <v-icon large color="navIcons">face</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1"
              >Roles
              <UpgradeBadge
                v-if="isCloud && !hasPermission('feature', 'custom-role')"
                depressed
                inline
              >
                <span class="font-weight-medium">Custom Roles</span> are only
                available on Enterprise plans.
              </UpgradeBadge></v-list-item-title
            >
            <v-list-item-subtitle>
              Manage Team Roles
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :to="'/team/projects'">
          <v-list-item-avatar tile>
            <v-icon large color="navIcons">
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

        <v-list-item :disabled="!isCloud" :to="'/team/secrets'">
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

        <v-list-item :disabled="!isCloud" :to="'/team/kv'">
          <v-list-item-avatar tile>
            <span style="color: Dodgerblue;">
              <i class="fad fa-brackets-curly fa-2x"></i>
            </span>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              KV Store
            </v-list-item-title>
            <v-list-item-subtitle>
              Manage your team's key/value store
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :disabled="!isCloud" :to="'/team/service-accounts'">
          <v-list-item-avatar tile>
            <i class="o-100 fad fa-user-hard-hat fa-2x" />
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="text-subtitle-1">
              Service Accounts
            </v-list-item-title>
            <v-list-item-subtitle>
              Manage Service Accounts and API Keys
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :disabled="!isCloud" :to="'/team/task-concurrency'">
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
      </v-list>
    </v-sheet>
  </v-menu>
</template>

<style lang="scss" scoped>
$dark-grey-icon: var(--v-navIcons-base);
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

.fa-user-hard-hat {
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

/* stylelint-disable-next-line */
.v-list-item--disabled {
  /* stylelint-disable-next-line */
  .v-list-item__avatar {
    opacity: 0.25 !important;
  }

  /* stylelint-disable-next-line */
  .v-list-item__subtitle {
    opacity: 0.4 !important;
  }
}
</style>
