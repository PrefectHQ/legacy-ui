<script>
import { mapMutations, mapGetters, mapActions } from 'vuex'
import moment from 'moment-timezone'
import { handleMembershipInvitations } from '@/mixins/membershipInvitationMixin'
import AcceptConfirmInputRow from '@/components/AcceptConfirmInputRow'
import Feedback from '@/components/Feedback'
import { stopDefaultClient, refreshDefaultClient } from '@/vue-apollo'

const UI_DEPLOY_TIMESTAMP = process.env.VUE_APP_RELEASE_TIMESTAMP

const tenantProtectedRoutes = [
  'project',
  'flow',
  'flow-run',
  'task',
  'task-run',
  'flow-run-logs',
  'select-plan',
  'billing',
  'welcome',
  'current-plan',
  'payment',
  'api',
  'name-team'
]

const backendProtectedRoutes = [
  'team',
  'account',
  'task-concurrency',
  'members',
  'secrets',
  'tokens',
  'user',
  'profile',
  'user-tokens',
  'welcome',
  'name-team',
  'onboard-resources'
]

export default {
  components: {
    AcceptConfirmInputRow,
    Feedback
  },
  mixins: [handleMembershipInvitations],
  data() {
    return {
      confirm: false,
      cloudTimestamp: null,
      feedbackDialog: false,
      items: [],
      loading: false,
      pendingInvitations: [],
      selectedTenant: null,
      tenantMenuOpen: false,
      tzMenuOpen: false,
      switchHovered: false
    }
  },
  computed: {
    ...mapGetters('api', [
      'isServer',
      'isCloud',
      'version',
      'releaseTimestamp'
    ]),
    ...mapGetters('sideNav', ['isOpen']),
    ...mapGetters('tenant', ['tenant', 'tenants', 'tenantIsSet']),
    ...mapGetters('user', ['memberships', 'user']),
    ...mapGetters('auth0', ['authorizationToken']),
    ...mapGetters('license', ['hasLicense']),
    lastDeployment_Cloud() {
      return this.releaseTimestamp
        ? moment(this.releaseTimestamp).format('MMM D [•] h:mmA')
        : 'Unknown'
    },
    lastDeployment_UI() {
      return moment(UI_DEPLOY_TIMESTAMP).format('MMM D [•] h:mmA')
    },
    logo() {
      return require(`@/assets/logos/${
        this.isCloud ? 'cloud' : 'core'
      }-logo-no-text.svg`)
    },
    logoAlt() {
      return require(`@/assets/logos/${
        this.isCloud ? 'core' : 'cloud'
      }-logo-no-text.svg`)
    },
    navLogo() {
      return require(`@/assets/logos/${
        this.isCloud ? 'cloud' : 'core'
      }-side-nav-logo.svg`)
    },
    open: {
      get() {
        return this.isOpen
      },
      set(value) {
        if (value === false) {
          this.close()
          this.tenantMenuOpen = false
        } else {
          this.$apollo.queries.pendingInvitations.refetch()
        }
      }
    },
    role() {
      if (!this.tenant) return

      let role
      switch (this.tenant.role) {
        case 'USER':
          role = 'User'
          break
        case 'READ_ONLY_USER':
          role = 'Restricted User'
          break
        case 'TENANT_ADMIN':
          role = 'Administrator'
          break
        default:
          role = ''
          break
      }
      return role
    },
    routeDisabled() {
      return false
      // !this.tenant.id || !this.tenant.settings.teamNamed
    },
    width() {
      if (this.$vuetify.breakpoint.xsOnly) {
        return window.innerWidth
      }
      return '300'
    }
  },
  watch: {
    $route() {
      this.close()
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapActions('api', ['switchBackend', 'backend']),
    ...mapActions('auth0', ['logout']),
    ...mapActions('license', ['getLicense']),
    ...mapActions('tenant', ['setCurrentTenant']),
    ...mapActions('user', ['getUser']),
    ...mapMutations('refresh', ['add']),
    ...mapMutations('sideNav', ['toggle', 'close']),
    async _switchBackend() {
      this.loading = true

      stopDefaultClient()

      if (!this.isCloud) {
        await this.switchBackend('CLOUD')
      } else {
        await this.switchBackend('SERVER')
      }

      this.loading = false

      refreshDefaultClient()
      this.handlePostTokenRouting()
    },
    getRoute(name) {
      let route = {
        name: name
      }

      if (tenantProtectedRoutes.includes(name) || name == 'dashboard') {
        route.params = { tenant: this.tenant?.slug }
      }
      return route
    },
    async handleSwitchTenant(tenant) {
      this.loading = true
      stopDefaultClient()

      if (tenant.slug == this.tenant.slug) return

      await this.setCurrentTenant(tenant.slug)

      this.loading = false
      this.tenantMenuOpen = false
      refreshDefaultClient()
      this.handlePostTokenRouting()
    },
    handlePostTokenRouting() {
      if (this.isCloud && !this.tenant.settings.teamNamed) {
        this.$router.push({
          name: 'welcome',
          params: {
            tenant: this.tenant.slug
          }
        })

        return
      }

      if (
        tenantProtectedRoutes.includes(this.$route.name) ||
        (this.isServer && backendProtectedRoutes.includes(this.$route.name))
      ) {
        this.$router.push({
          name: 'dashboard',
          params: { tenant: this.tenant.slug }
        })
      } else {
        this.$router.push({
          name: this.$route.name,
          params: { ...this.$route.params, tenant: this.tenant.slug }
        })
      }
    },
    handleTenantSwitcherClick(e) {
      e.stopPropagation()
      this.tenantMenuOpen = !this.tenantMenuOpen
    },
    handleRouteToCreateTenant() {
      // We'll route to the new team page when that's done.
    },
    async handleAcceptPendingInvitation(id, name) {
      let success
      try {
        await this.acceptMembershipInvitation(id)
        success = true
      } catch (e) {
        success = false
      }

      this.setAlert(
        {
          alertShow: true,
          alertMessage: success
            ? `You joined ${name}... hurrah!`
            : `Something went wrong trying to accept your invitation to ${name}.... please wait a few moments and try again.`,
          alertType: success ? 'success' : 'error'
        },
        3000
      )
      this.$apollo.queries.pendingInvitations.refetch()
    },
    async handleDeclinePendingInvitation(id, name) {
      let success
      try {
        await this.declineMembershipInvitation(id)
        success = true
      } catch (e) {
        success = false
      }

      this.setAlert(
        {
          alertShow: true,
          alertMessage: success
            ? `Invitation to join ${name} declined.`
            : `Something went wrong trying to decline your invitation to ${name}.... please wait a few moments and try again.`,
          alertType: success ? 'info' : 'error'
        },
        3000
      )
      this.$apollo.queries.pendingInvitations.refetch()
    },
    closeDialogAndMenu() {
      this.feedbackDialog = false
      this.open = false
    }
  },
  apollo: {
    pendingInvitations: {
      query: require('@/graphql/Tenant/pending-invitations-by-email.gql'),
      variables() {
        return {
          email: this.user.email
        }
      },
      async result({ data, loading }) {
        if (loading || !data || !data.pendingInvitations) return
        // We filter this because we don't want to show invitations
        // to tenants we're already in...
        // This is due to a bug(feature?) in the back end that allows
        // users to be invited to tenants they're already part of
        await this.getUser()
        this.pendingInvitations =
          data.pendingInvitations && data.pendingInvitations.length
            ? data.pendingInvitations.filter(
                pi =>
                  !this.memberships
                    .map(at => at.tenant.id)
                    .includes(pi.tenant.id)
              )
            : []
      },
      skip() {
        return (
          !this.isCloud ||
          !this.memberships ||
          !this.user ||
          !this.user.email ||
          !this.tenantIsSet
        )
      },
      fetchPolicy: 'network-only',
      pollInterval: 60000
    }
  }
}
</script>

<template>
  <!-- We need both v-if and v-model because this vuetify component
  has mobile touch functionality that we want to preserve  -->
  <v-expand-x-transition>
    <v-navigation-drawer
      v-if="open"
      v-model="open"
      app
      clipped
      left
      temporary
      :width="width"
      style="overflow: visible !important;"
    >
      <div class="lists-wrapper" @click="tenantMenuOpen = false">
        <v-list flat>
          <v-list-item class="side-nav-header">
            <v-list-item-content>
              <v-img
                height="40"
                contain
                class="logo"
                position="left"
                :src="navLogo"
                alt="Prefect Logo"
              />
            </v-list-item-content>
            <v-list-item-action>
              <v-btn icon small @click="close">
                <v-icon>close</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>

          <v-list-item
            active-class="primary-active-class"
            data-cy="side-nav-dashboard-item"
            :to="getRoute('home')"
            ripple
            exact
          >
            <v-list-item-action>
              <v-icon>home</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Home</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            active-class="primary-active-class"
            data-cy="side-nav-dashboard-item"
            :disabled="routeDisabled"
            :to="getRoute('dashboard')"
            ripple
            exact
          >
            <v-list-item-action>
              <v-icon>view_quilt</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Dashboard</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-tooltip v-if="role == 'Restricted User'" top>
            <template v-slot:activator="{ on }">
              <v-list-item data-cy="sidenav-api" v-on="on">
                <v-list-item-action>
                  <v-icon>vertical_split</v-icon>
                </v-list-item-action>
                <v-list-item-content>
                  <v-list-item-title class="grey--text"
                    >Interactive API</v-list-item-title
                  >
                </v-list-item-content>
              </v-list-item>
            </template>
            <span
              >Read-only users do not have access to the Interactive API</span
            >
          </v-tooltip>

          <v-list-item
            v-else
            active-class="primary-active-class"
            :disabled="routeDisabled"
            :to="getRoute('api')"
            ripple
          >
            <v-list-item-action>
              <v-icon>vertical_split</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Interactive API</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <!-- <v-list-item :to="{ name: 'schematics' }" ripple>
            <v-list-item-action>
              <v-icon>account_tree</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Flow Schematics</v-list-item-title>
            </v-list-item-content>
          </v-list-item> -->

          <v-list-item
            v-if="isCloud"
            active-class="primary-active-class"
            data-cy="side-nav-team-item"
            :disabled="routeDisabled"
            :to="getRoute('team')"
            ripple
          >
            <v-list-item-action>
              <v-icon>people</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Team</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            v-if="isCloud"
            active-class="primary-active-class"
            data-cy="side-nav-user-item"
            :disabled="routeDisabled"
            :to="getRoute('user')"
            ripple
          >
            <v-list-item-action>
              <v-icon>person</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>User</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <v-list dense>
          <v-list-item
            id="tutorial"
            active-class="primary-active-class"
            :disabled="routeDisabled"
            :to="getRoute('tutorial')"
          >
            <v-list-item-action>
              <v-icon>school</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Tutorials</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-list-item
            class="bottom"
            ripple
            target="_blank"
            href="https://docs.prefect.io"
          >
            <v-list-item-action>
              <v-icon>library_books</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Documentation</v-list-item-title>
            </v-list-item-content>
            <v-list-item-action>
              <v-icon x-small>
                open_in_new
              </v-icon>
            </v-list-item-action>
          </v-list-item>
          <v-list-item
            v-if="isCloud"
            id="Support"
            active-class="primary-active-class"
            :to="{ name: 'help' }"
          >
            <v-list-item-action>
              <v-icon>help</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>Support</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-dialog
            v-if="isCloud"
            v-model="feedbackDialog"
            max-width="560"
            @click:outside="closeDialogAndMenu"
          >
            <template v-slot:activator="{ on }">
              <v-list-item
                id="Feedback"
                active-class="primary-active-class"
                v-on="on"
              >
                <v-list-item-action>
                  <v-icon>feedback</v-icon>
                </v-list-item-action>
                <v-list-item-content>
                  <v-list-item-title>Feedback</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
            <Feedback @close="closeDialogAndMenu" />
          </v-dialog>

          <v-divider class="mt-4" />

          <v-list-item
            dense
            one-line
            @mouseover="switchHovered = true"
            @mouseleave="switchHovered = false"
            @click="_switchBackend"
          >
            <v-list-item-content>
              <v-list-item-title class="">
                <div class="overline grey--text text-center">
                  <v-scroll-y-transition mode="out-in">
                    <div v-if="switchHovered" key="1">
                      <div
                        >Switch to
                        <span
                          :class="`${!isCloud ? 'primary' : 'secondary'}--text`"
                        >
                          {{ !isCloud ? 'Cloud' : 'Server' }}
                        </span></div
                      >
                    </div>
                    <div v-else key="2">
                      <div>Last Deployed</div>
                    </div>
                  </v-scroll-y-transition>
                </div>

                <v-row
                  class="overline grey--text text--darken-2 d-flex justify-center align-center pb-2"
                  no-gutters
                >
                  <v-col cols="5" class="text-right">
                    <div class="font-weight-bold">API</div>
                    <div class="truncate">{{ lastDeployment_Cloud }}</div>
                  </v-col>
                  <v-col cols="2" class="px-2">
                    <v-avatar
                      max-width="100%"
                      min-width="20"
                      min-height="auto"
                      height="auto"
                      left
                      class="elevation-8 mx-auto"
                      style="border: 1px solid #fff;"
                    >
                      <v-fade-transition mode="out-in">
                        <img
                          v-if="!switchHovered"
                          key="1"
                          style="max-width: 100%;"
                          :src="logo"
                        />
                        <img
                          v-else
                          key="2"
                          style="max-width: 100%;"
                          :src="logoAlt"
                        />
                      </v-fade-transition>
                    </v-avatar>
                  </v-col>
                  <v-col cols="5" class="text-left">
                    <div class="font-weight-bold">UI</div>
                    <div class="truncate">{{ lastDeployment_UI }}</div>
                  </v-col>
                </v-row>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            v-if="isCloud"
            class="tenant-switcher primary theme--dark mt-0"
            two-line
            @click="handleTenantSwitcherClick"
          >
            <v-list-item-content
              style="
              max-width: 80%;
              overflow: unset;"
            >
              <v-list-item-subtitle class="text-caption">
                Current team
              </v-list-item-subtitle>

              <v-list-item-title class="tenant-title text-uppercase">
                <div class="text text-truncate">
                  {{
                    tenant.name
                      ? tenant.name
                      : loading
                      ? '...'
                      : 'No team selected'
                  }}
                </div>
                <div
                  v-if="pendingInvitations"
                  class="badge"
                  :class="pendingInvitations.length < 1 ? 'badge--hidden' : ''"
                >
                  {{ pendingInvitations.length }}
                </div>
              </v-list-item-title>

              <v-list-item-subtitle>
                {{ role }}
              </v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action>
              <v-icon
                :style="{
                  transform: `rotate(${tenantMenuOpen ? '180deg' : '0'})`
                }"
                x-large
              >
                arrow_right
              </v-icon>
            </v-list-item-action>
          </v-list-item>

          <v-list-item
            v-else
            class="tenant-switcher secondary theme--dark mt-0"
            data-cy="tenant-switcher"
            two-line
            @click="handleTenantSwitcherClick"
          >
            <v-list-item-content
              style="
              max-width: 80%;
              overflow: unset;"
            >
              <v-list-item-subtitle class="text-caption">
                Current team
              </v-list-item-subtitle>

              <v-list-item-title class="tenant-title text-uppercase">
                <div class="text text-truncate">
                  {{
                    tenant.name
                      ? tenant.name
                      : loading
                      ? '...'
                      : 'No team selected'
                  }}
                </div>
              </v-list-item-title>

              <v-list-item-subtitle>
                {{ role }}
              </v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action>
              <v-icon
                :style="{
                  transform: `rotate(${tenantMenuOpen ? '180deg' : '0'})`
                }"
                x-large
                color="white"
              >
                arrow_right
              </v-icon>
            </v-list-item-action>
          </v-list-item>
        </v-list>
      </div>

      <v-expand-x-transition>
        <v-card
          v-if="tenantMenuOpen && isCloud && memberships"
          key="cloudTenantMenu"
          class="tenant-switcher-list elevation-4"
          tile
        >
          <v-progress-linear
            absolute
            :active="loading"
            :indeterminate="loading"
          />
          <v-list class="ma-2" dense flat :disabled="loading">
            <v-list-item-group v-if="pendingInvitations.length > 0" subheader>
              <v-subheader>Pending Invitations</v-subheader>
              <v-slide-x-transition
                v-for="pt in pendingInvitations"
                :key="pt.id"
              >
                <v-list-item
                  two-line
                  :ripple="false"
                  class="disabled-list pr-0"
                >
                  <v-list-item-content>
                    <v-list-item-title>
                      <AcceptConfirmInputRow
                        :label="pt.tenant.name"
                        @accept="
                          handleAcceptPendingInvitation(pt.id, pt.tenant.name)
                        "
                        @decline="
                          handleDeclinePendingInvitation(pt.id, pt.tenant.name)
                        "
                      />
                    </v-list-item-title>
                  </v-list-item-content>
                </v-list-item>
              </v-slide-x-transition>
            </v-list-item-group>

            <v-list-item-group subheader data-cy="switch-tenant">
              <v-subheader>Active Teams</v-subheader>
              <v-list-item
                v-for="at in memberships"
                :key="at.id"
                two-line
                @click="handleSwitchTenant(at.tenant)"
              >
                <v-list-item-content>
                  <v-list-item-title
                    :class="
                      tenant.id == at.tenant.id ? 'blue--text accent-4' : ''
                    "
                  >
                    {{ at.tenant.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle
                    v-if="tenant.id == at.tenant.id"
                    class="font-weight-light"
                  >
                    Current
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
            <!-- Hiding this until the create new team page is finished -->
            <v-list-item-group v-if="false" subheader>
              <v-subheader />
              <v-list-item @click="handleRouteToCreateTenant()">
                <v-list-item-action>
                  <v-icon>add_circle_outline</v-icon>
                </v-list-item-action>
                <v-list-item-content>
                  <v-list-item-title class="grey--text text--darken-1">
                    Create New Team
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card>

        <v-card
          v-else-if="tenantMenuOpen && isServer && tenants"
          key="serverTenantMenu"
          class="tenant-switcher-list elevation-4"
          tile
        >
          <v-progress-linear
            absolute
            :active="loading"
            :indeterminate="loading"
          />
          <v-list class="ma-2" dense flat :disabled="loading">
            <v-list-item-group subheader data-cy="switch-tenant">
              <v-subheader>Teams</v-subheader>
              <v-list-item
                v-for="ten in tenants"
                :key="ten.id"
                two-line
                @click="handleSwitchTenant(ten)"
              >
                <v-list-item-content>
                  <v-list-item-title
                    :class="tenant.id == ten.id ? 'blue--text accent-4' : ''"
                  >
                    {{ ten.name }}
                  </v-list-item-title>
                  <v-list-item-subtitle
                    v-if="tenant.id == ten.id"
                    class="font-weight-light"
                  >
                    Current
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
            <!-- Hiding this until the create new team page is finished -->
            <v-list-item-group v-if="false" subheader>
              <v-subheader />
              <v-list-item @click="handleRouteToCreateTenant()">
                <v-list-item-action>
                  <v-icon>add_circle_outline</v-icon>
                </v-list-item-action>
                <v-list-item-content>
                  <v-list-item-title class="grey--text text--darken-1">
                    Create New Team
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list-item-group>
          </v-list>
        </v-card>
      </v-expand-x-transition>
    </v-navigation-drawer>
  </v-expand-x-transition>
</template>

<style lang="scss" scoped>
.lists-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: space-between;
  min-width: 300px;

  .v-list {
    padding: 0;
  }

  .side-nav-header {
    border-bottom: 2px solid #eee;
  }
}

.primary-active-class:not(.v-list-item--disabled) {
  color: var(--v-primary-base) !important;
}

.v-list-item--disabled {
  color: #aaa;
}

.tenant-switcher {
  cursor: pointer;
  height: 100px;
  margin-top: 20px;
  position: relative;

  .tenant-title {
    $badge-size: 20px;

    line-height: $badge-size;
    position: relative;

    .text {
      float: left;
      font-size: 0.9rem !important;
      font-weight: bold;
      max-width: 80%;
    }

    /* stylelint-disable */
    /* Disabling this because the style linter only allows aria-label or empty content attributes */
    .badge {
      /* stylelint-enable */
      background-color: #da2072;
      border-radius: 50%;
      content: attr(data-after-content);
      float: right;
      font-size: 12px;
      height: $badge-size;
      left: 80%;
      // position: absolute;
      // right: 5px;
      margin: auto;
      text-align: center;
      top: -$badge-size;
      transition: 0.1s linear all;
      width: $badge-size;
      z-index: 9;
    }

    .badge--hidden {
      transform: scale(0);
    }
  }
}

.tenant-switcher-list {
  bottom: 0;
  left: 300px;
  max-height: calc(100% - 100px);
  overflow-y: scroll;
  position: absolute;
  width: 100%;

  @media screen and (max-width: 600px) {
    bottom: 100px;
    left: 0;
  }

  .v-list {
    padding: 0;
  }

  .v-list-item {
    cursor: pointer;

    &:active {
      .title {
        color: #123456 !important;
      }
    }

    &:hover:not(.disabled-list),
    &:focus:not(.disabled-list) {
      background-color: rgba(0, 0, 0, 0.05) !important;
    }

    &.disabled-list {
      cursor: auto;
    }
  }
}
</style>
