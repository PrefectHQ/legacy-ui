<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'
import ExternalLink from '@/components/ExternalLink'
import GlobalSearch from '@/components/GlobalSearchBar/GlobalSearch'
import moment from '@/utils/moment'

export default {
  components: { ExternalLink, GlobalSearch },
  data() {
    return {
      connectionMenu: false,
      loading: false,
      pendingInvitations: [],
      menu: false,
      clock: null,
      time: Date.now()
    }
  },
  computed: {
    ...mapGetters('api', [
      'isServer',
      'isCloud',
      'url',
      'apiMode',
      'connected',
      'connecting',
      'retries'
    ]),
    ...mapGetters('auth0', ['isAuthorized']),
    ...mapGetters('license', ['hasLicense']),
    ...mapGetters('tenant', ['tenant', 'tenantIsSet']),
    ...mapGetters('user', ['memberships', 'user', 'auth0User', 'timezone']),
    connectedIcon() {
      if (this.connected) return 'signal_cellular_4_bar'
      if (this.connecting) return 'signal_cellular_null'
      return 'signal_cellular_off'
    },
    navBarColor() {
      return this.isTransparent
        ? 'transparent'
        : this.isCloud
        ? 'primary'
        : 'secondary'
    },
    isTransparent() {
      return this.$route.name === 'not-found'
    },
    isWelcome() {
      return (
        this.$route.name === 'welcome' ||
        this.$route.name === 'onboard-resources' ||
        this.$route.name === 'name-team'
      )
    }
  },
  mounted() {
    clearInterval(this.clock)
    this.clock = setInterval(() => {
      this.time = Date.now()
    }, 1000)
  },
  methods: {
    ...mapMutations('sideNav', ['open']),
    ...mapMutations('refresh', ['add']),
    ...mapActions('auth0', ['logout']),
    formatTime(time) {
      let timeObj = moment(time).tz(this.timezone),
        shortenedTz = moment()
          .tz(this.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
          .zoneAbbr()
      return `${
        timeObj ? timeObj.format('h:mm A') : moment(time).format('h:mm A')
      } ${shortenedTz}`
    },
    trackAndLogout() {
      this.logout(this.$apolloProvider.clients.defaultClient)
    },
    refresh() {
      if (this.$route.name == 'dashboard') {
        this.loading = true
        this.add()
        setTimeout(() => {
          this.loading = false
        }, 1800)
      } else {
        this.$router.push({
          name: 'dashboard',
          params: { tenant: this.tenant.slug }
        })
      }
    }
  },
  apollo: {
    notificationsCount: {
      query: require('@/graphql/Notifications/notifications-count-unread.gql'),
      loadingKey: 'loading',
      update: data => data?.message_aggregate?.aggregate?.count,
      fetchPolicy: 'no-cache',
      skip() {
        return !this.connected || !this.tenantIsSet
      },
      pollInterval: 10000
    },
    pendingInvitations: {
      query: require('@/graphql/Tenant/pending-invitations-by-email.gql'),
      variables() {
        return {
          email: this.user.email
        }
      },
      async result({ data, loading }) {
        if (loading || !data) return
        // We filter this because we don't want to show invitations
        // to tenants we're already in...
        // This is due to a bug(feature?) in the back end that allows
        // users to be invited to tenants they're already part of
        if (data.pendingInvitations) {
          this.pendingInvitations = data.pendingInvitations.filter(
            pi =>
              !this.memberships.map(at => at.tenant.id).includes(pi.tenant.id)
          )
        }
      },
      skip() {
        return !this.connected || this.isServer || !this.tenantIsSet
      },
      fetchPolicy: 'no-cache',
      pollInterval: 10000
    }
  }
}
</script>

<template>
  <v-app-bar
    v-if="!isWelcome"
    :class="{
      'elevation-0': isTransparent
    }"
    :color="navBarColor"
    :fixed="!isTransparent"
    clipped-right
    clipped-left
    :app="!isTransparent"
  >
    <v-progress-linear
      :active="loading"
      :indeterminate="loading"
      background-color="white"
      color="blue"
      absolute
      bottom
    />

    <v-app-bar-nav-icon
      :color="isTransparent ? 'primary' : 'white'"
      text
      data-cy="open-sidenav"
      icon
      large
      class="badge"
      :class="
        pendingInvitations && pendingInvitations.length > 0
          ? ''
          : 'badge--hidden'
      "
      @click="open"
    >
    </v-app-bar-nav-icon>

    <router-link
      :to="{
        name: 'dashboard',
        params: { tenant: tenant ? tenant.slug : null }
      }"
    >
      <v-btn
        v-if="!isTransparent"
        color="primary"
        text
        icon
        large
        @click="refresh"
      >
        <img
          class="logo"
          style="pointer-events: none;"
          src="@/assets/logos/logomark-light.svg"
          alt="The Prefect Logo"
        />
      </v-btn>
    </router-link>

    <v-spacer />

    <GlobalSearch v-if="isServer || isAuthorized" />
    <v-menu
      v-model="connectionMenu"
      :close-on-content-click="false"
      offset-y
      transition="slide-y-transition"
    >
      <template #activator="{ on }">
        <v-btn
          class="ml-2 position-relative"
          text
          icon
          large
          color="white"
          v-on="on"
        >
          <v-icon>
            {{ connectedIcon }}
          </v-icon>
          <v-icon
            v-if="connecting"
            small
            color="primary"
            class="position-absolute"
            :style="{
              bottom: '-8px',
              right: '0'
            }"
          >
            fas fa-spinner fa-pulse
          </v-icon>
          <v-icon
            v-if="apiMode == 'maintenance'"
            small
            color="accentPink"
            class="position-absolute"
            :style="{
              bottom: '-8px',
              right: '0'
            }"
          >
            fas fa-exclamation
          </v-icon>
        </v-btn>
      </template>
      <v-card
        tile
        class="pa-0"
        max-width="700"
        :min-width="
          (isServer && (!connected || connecting)) || apiMode == 'maintenance'
            ? 600
            : 300
        "
      >
        <v-card-text class="pb-0">
          <div class="mb-2">
            <span v-if="connected">Connected</span>
            <span v-else-if="connecting">Connecting</span>
            <span v-else>Couldn't connect</span>
            to
            <span class="font-weight-bold">
              <span v-if="isCloud" class="primary--text">Prefect Cloud</span>
              <span v-else class="secondaryGray--text">Prefect Server</span>
            </span>
            <span v-if="isServer">
              at
              <span class="font-weight-bold">{{ url }}</span>
            </span>

            <v-alert
              v-if="isServer && (!connected || connecting)"
              border="left"
              colored-border
              class="text-body-1 mt-2"
              icon="cloud"
              color="primary"
              tile
            >
              <div>
                Having trouble?
                <span class="font-weight-medium">Don't panic! </span>
              </div>
              <div class="mt-4">
                The <v-icon x-small>fab fa-slack</v-icon>&nbsp;
                <ExternalLink
                  href="https://join.slack.com/t/prefect-community/shared_invite/enQtODQ3MTA2MjI4OTgyLTliYjEyYzljNTc2OThlMDE4YmViYzk3NDU4Y2EzMWZiODM0NmU3NjM0NjIyNWY0MGIxOGQzODMxNDMxYWYyOTE"
                  >Prefect Slack community</ExternalLink
                >
                is a great place to ask questions, provide feedback, or just to
                chat! Check out the
                <ExternalLink
                  href="https://docs.prefect.io/orchestration/server/overview.html#what-is-prefect-server"
                  >Prefect documentation</ExternalLink
                >

                for tips on setting up Prefect Server, idioms for writing flows,
                and so much more. Looking for more in-depth discussion? Our
                <ExternalLink
                  href="https://github.com/PrefectHQ/prefect/discussions/category_choices"
                  >GitHub Discussion board</ExternalLink
                >
                is a great place to present long-form ideas, technical
                challenges, or to show off your Prefect tasks and flows!

                <div class="mt-4"
                  >Did you know that

                  <ExternalLink href="https://www.prefect.io/cloud"
                    >Prefect Cloud</ExternalLink
                  >
                  offers a feature-rich and fully-managed orchestration layer
                  for your flows? Oh and it's also <em>free</em>.
                </div>
              </div>
            </v-alert>
          </div>
          <v-alert
            v-if="apiMode == 'maintenance'"
            border="left"
            colored-border
            class="text-body-1"
            type="warning"
            color="accentPink"
            tile
          >
            Prefect Cloud is undergoing routine maintenance; during this time no
            new runs will be released to your Agents and state updates may be
            delayed.
          </v-alert>
        </v-card-text>
        <v-card-actions class="pt-0">
          <v-spacer></v-spacer>
          <v-btn small text @click="connectionMenu = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>

    <v-scale-transition>
      <v-btn
        v-if="isServer || isAuthorized"
        color="white"
        text
        icon
        data-cy="go-to-notifications"
        large
        class="badge badge-left ml-4"
        :class="
          notificationsCount && notificationsCount > 0 ? '' : 'badge--hidden'
        "
        :to="{ name: 'notifications' }"
      >
        <v-icon>notifications</v-icon>
      </v-btn>
    </v-scale-transition>

    <v-menu
      v-model="menu"
      offset-y
      data-cy="nav-bar-menu"
      transition="slide-y-transition"
      nudge-bottom="15"
    >
      <template #activator="{ on }">
        <v-scale-transition>
          <v-avatar
            v-if="isCloud"
            class="ml-4 cursor-pointer"
            size="42"
            v-on="on"
          >
            <img :src="auth0User.picture" :alt="auth0User.name" />
          </v-avatar>
        </v-scale-transition>
      </template>

      <v-list class="pb-0" dense width="250">
        <v-list-item
          :disabled="!tenant.settings.teamNamed && !hasLicense"
          :to="{ name: 'user' }"
          exact
          three-line
          dense
        >
          <v-list-item-avatar>
            <img :src="auth0User.picture" :alt="auth0User.name" />
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title>
              {{ user.first_name }} {{ user.last_name }}
            </v-list-item-title>
            <v-list-item-subtitle>{{ auth0User.email }}</v-list-item-subtitle>
            <v-list-item-subtitle>
              <v-tooltip bottom>
                <template #activator="{ on }">
                  <span v-on="on">
                    {{ formatTime(time) }}
                    <v-icon class="material-icons-outlined" x-small>
                      info
                    </v-icon>
                  </span>
                </template>
                System time according to your set Timezone
              </v-tooltip>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item class="text-right" @click="trackAndLogout">
          <v-list-item-content>
            <v-list-item-title>Sign Out</v-list-item-title>
          </v-list-item-content>
          <v-list-item-avatar>
            <v-icon color="primary">input</v-icon>
          </v-list-item-avatar>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-scale-transition>
      <div
        v-if="isServer"
        class="white--text ml-4 text-body-1"
        style="white-space: pre;"
      >
        {{ formatTime(time) }}
      </div>
    </v-scale-transition>
  </v-app-bar>
</template>

<style lang="scss" scoped>
.logo {
  width: 1rem;
}

.badge {
  overflow: unset;
  position: relative;

  /* stylelint-disable */
  /* Disabling this because the style linter doesn't like the small font-size */
  &::after {
    /* stylelint-enable */
    $badge-size: 12.5px;

    background-color: #da2072;
    border-radius: 50%;
    bottom: 5px;
    content: '';
    font-size: 12px;
    height: $badge-size;
    line-height: $badge-size;
    position: absolute;
    right: 5px;
    text-align: center;
    transition: 0.1s linear all;
    width: $badge-size;
    z-index: 9;
  }

  &.badge-left::after {
    left: 5px;
    right: auto;
  }

  &.badge--hidden::after {
    content: '' !important;
    transform: scale(0);
  }
}

.cursor-pointer {
  cursor: pointer;
}
</style>
