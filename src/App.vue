<script>
import Alert from '@/components/Alert'
import Footer from '@/components/Footer'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { clearCache } from '@/vue-apollo'
import moment from 'moment'
// import { authMixin } from '@/mixins/authMixin'
import ApplicationNavBar from '@/components/Nav/ApplicationNav'
import GlobalSearch from '@/components/GlobalSearchBar/GlobalSearch'
import TeamSideNav from '@/components/Nav/TeamSideNav'
import WorkQueueBanner from '@/components/WorkQueueBanner'
import { eventsMixin } from '@/mixins/eventsMixin'
import debounce from 'lodash.debounce'
import VSnackbars from '@/components/Snackbars/Snackbars'

const SERVER_KEY = `${process.env.VUE_APP_RELEASE_TIMESTAMP}_server_url`

const fullPageRoutes = [
  'api',
  '404',
  'calendar',
  'not-found',
  'access-denied',
  'team-switched',
  'logout',
  'welcome',
  'roles'
]

const onboardRoutes = ['welcome', 'name-team', 'onboard-resources', 'accept']

export default {
  metaInfo() {
    return {
      title: `Prefect ${this.backend == 'CLOUD' ? 'Cloud' : 'Server'}`,
      link: [
        {
          rel: 'icon',
          href: null,
          vmid: 'favicon'
        }
      ]
    }
  },
  components: {
    Alert,
    ApplicationNavBar,
    Footer,
    GlobalSearch,
    TeamSideNav,
    VSnackbars,
    WorkQueueBanner
  },
  mixins: [eventsMixin],
  data() {
    return {
      error: null,
      loadedComponents: 0,
      loadingKey: 0,
      numberOfComponents: 1,
      refreshTimeout: null,
      reset: false,
      shown: true,
      showFooter: false,
      startupHasRun: false,
      wholeAppShown: true
    }
  },
  computed: {
    ...mapGetters('api', [
      'backend',
      'version',
      'url',
      'connected',
      'connecting',
      'isServer',
      'isCloud'
    ]),
    ...mapGetters('alert', ['getAlert']),
    ...mapGetters('data', ['projects']),
    ...mapGetters('auth', ['isAuthenticated', 'isAuthorized']),
    ...mapGetters('tenant', [
      'tenant',
      'tenants',
      'defaultTenant',
      'tenantIsSet',
      'isLoadingTenant'
    ]),
    ...mapGetters('user', [
      'isDark',
      'memberships',
      'userIsSet',
      'user',
      'plan'
    ]),
    notFoundPage() {
      return this.$route.name === 'not-found'
    },
    fullPageRoute() {
      return fullPageRoutes.includes(this.$route.name)
    },
    loading() {
      return this.isAuthenticated && (this.connecting || this.isLoadingTenant)
    },
    showNav() {
      if (
        this.$route.name == 'plans' ||
        this.$route.name == 'not-found' ||
        this.$route.name == 'team-switched' ||
        this.$route.name == 'logout' ||
        onboardRoutes.includes(this.$route.name)
      )
        return false
      return (
        ((this.isCloud && this.isAuthenticated) || this.isServer) &&
        this.loadedComponents > 0
      )
    },
    isCloud() {
      return this.backend == 'CLOUD'
    },
    isWelcome() {
      return (
        this.$route.name === 'welcome' ||
        this.$route.name === 'onboard-resources' ||
        this.$route.name === 'name-team' ||
        this.$route.name === 'accept'
      )
    },
    paused() {
      return this.tenant?.settings?.work_queue_paused
    }
  },
  watch: {
    isDark(val) {
      this.$vuetify.theme.dark = val
    },
    backend() {
      this.loadedComponents = 0
      clearCache()
      this.resetData()

      this.refreshTimeout = setTimeout(() => {
        this.resetData()
        this.unsetInvitations()
        this.unsetTenants()
        this.unsetUser()
        this.refresh()
        clearTimeout(this.refreshTimeout)
      }, 1000)
      this.setSortedAgents(null)
    },
    async connected(val) {
      if (val) {
        clearCache()
      }
    },
    tenant(val, oldVal) {
      if (val?.id !== oldVal?.id) {
        if (this.isCloud && !this.tenant.settings.teamNamed) {
          this.$router.push({
            name: 'welcome',
            params: {
              tenant: this.tenant.slug
            }
          })
        }

        clearTimeout(this.refreshTimeout)
        this.refresh()
        this.resetData()
        this.$apollo.queries.agents.refresh()
        this.$apollo.queries.projects.refresh()
        this.$apollo.queries.flows.refresh()
      }
    },
    async $route(new_route, old_route) {
      this.showFooter = false

      if (
        new_route?.params?.tenant &&
        new_route?.params?.tenant !== old_route?.params?.tenant &&
        this.tenant?.slug !== new_route.params.tenant
      ) {
        await this.setCurrentTenant(new_route.params.tenant)
      }
    },
    isAuthorized(value) {
      if (value) {
        this.getApi()
        this.getTenants()
      }
    }
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown)
    window.removeEventListener('offline', this.handleOffline)
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('scroll', this.handleScroll)

    // this.oktaClient?.remove()

    // document.removeEventListener(
    //   'visibilitychange',
    //   this.handleVisibilityChange
    // )
    // window.removeEventListener('blur', this.handleVisibilityChange)
    // window.removeEventListener('focus', this.handleVisibilityChange)
  },
  async mounted() {
    if (!localStorage.getItem(SERVER_KEY)) {
      localStorage.setItem(
        SERVER_KEY,
        window.prefect_ui_settings?.server_url || process.env.VUE_APP_SERVER_URL
      )

      this.setServerUrl(localStorage.getItem(SERVER_KEY))
    }

    this.refresh()

    if (this.isAuthorized || this.isServer) {
      await this.getApi()

      if (!this.connected && this.isServer) {
        this.$router.push({ name: 'home' })
      }
    }

    this.$globalApolloQueries['tenants'] = this.$apollo.addSmartQuery(
      'tenants',
      {
        query: require('@/graphql/Tenant/tenants.js').default(this.isCloud),
        skip() {
          return (this.isCloud && !this.isAuthorized) || !this.connected
        },
        fetchPolicy: 'no-cache',
        pollInterval: 60000,
        update(data) {
          if (!data?.tenant) return []
          this.setTenants(data.tenant)
          return data.tenant
        }
      }
    )

    this.$globalApolloQueries['agents'] = this.$apollo.addSmartQuery('agents', {
      query() {
        return require('@/graphql/Agent/agents.js').default(this.isCloud)
      },
      skip() {
        return (this.isCloud && !this.isAuthorized) || !this.connected
      },
      pollInterval: 1000,
      // Without this, server UI with no actual server shows results
      fetchPolicy: 'no-cache',
      update(data) {
        if (!data?.agent || this.isLoadingTenant) return null
        this.setSortedAgents(data.agent)
        return data.agent
      }
    })

    this.$globalApolloQueries['projects'] = this.$apollo.addSmartQuery(
      'projects',
      {
        query() {
          return require('@/graphql/Nav/projects.gql')
        },
        skip() {
          return (this.isCloud && !this.isAuthorized) || !this.connected
        },
        pollInterval: 10000,
        update(data) {
          if (!data?.project || this.isLoadingTenant) return []
          this.setProjects(data.project)
          return data.project
        }
      }
    )

    this.$globalApolloQueries['flows'] = this.$apollo.addSmartQuery('flows', {
      query() {
        return require('@/graphql/Nav/flows.gql')
      },
      skip() {
        return (this.isCloud && !this.isAuthorized) || !this.connected
      },
      pollInterval: 10000,
      update(data) {
        if (!data?.flow || this.isLoadingTenant) return []
        this.setFlows(data.flow)
        return data.flow
      }
    })

    this.$globalApolloQueries['memberships'] = this.$apollo.addSmartQuery(
      'memberships',
      {
        query: require('@/graphql/User/user.gql'),
        skip() {
          return (
            !this.isCloud ||
            !this.isAuthorized ||
            !this.memberships ||
            !this.user ||
            !this.user.email ||
            !this.tenantIsSet
          )
        },
        fetchPolicy: 'no-cache',
        pollInterval: 60000,
        update(data) {
          if (!data?.user?.[0]) return []
          this.setUser(data.user[0])

          return data.user[0]
        }
      }
    )

    this.$globalApolloQueries[
      'membershipInvitations'
    ] = this.$apollo.addSmartQuery('membershipInvitations', {
      query: require('@/graphql/Tenant/pending-invitations-by-email.gql'),
      variables() {
        return {
          email: this.user.email
        }
      },
      skip() {
        return (
          !this.isCloud ||
          !this.isAuthorized ||
          !this.memberships ||
          !this.user ||
          !this.user.email ||
          !this.tenantIsSet
        )
      },
      fetchPolicy: 'network-only',
      pollInterval: 10000,
      update(data) {
        if (!data?.pendingInvitations || this.isLoadingTenant) return []
        this.setInvitations(data.pendingInvitations)
        return data.pendingInvitations
      }
    })
  },
  async beforeMount() {
    document.addEventListener('keydown', this.handleKeydown)
    window.addEventListener('offline', this.handleOffline)
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('scroll', this.handleScroll)
    const dark = localStorage.getItem('dark_mode') === 'true' || this.isDark
    if (dark) {
      this.$vuetify.theme.dark = true
    } else {
      this.$vuetify.theme.dark = false
    }

    if (this.isCloud) {
      if (
        window.location.pathname?.includes('logout') ||
        window.location.pathname?.includes('access-denied')
      )
        return

      // If the application has loaded but the user isn't authenticated, authorized, or has no tenant
      // redirect them to the help screen
      if (!this.isAuthorized || !this.isAuthenticated || !this.tenant?.id) {
        this.$router.push({
          name: 'access-denied',
          params: {
            tenant: this.tenant.slug
          }
        })

        // otherwise, if they haven't gone through onboarding, route them there
      } else if (!this.tenant.settings.teamNamed) {
        this.$router.push({
          name: 'welcome',
          params: {
            tenant: this.tenant.slug
          }
        })
      }
    }

    // document.addEventListener(
    //   'visibilitychange',
    //   this.handleVisibilityChange,
    //   false
    // )
    // window.addEventListener('blur', this.handleVisibilityChange, false)
    // window.addEventListener('focus', this.handleVisibilityChange, false)
  },
  methods: {
    ...mapMutations('agent', ['setSortedAgents']),
    ...mapActions('api', ['getApi', 'monitorConnection', 'setServerUrl']),
    ...mapActions('auth', ['authenticate', 'authorize']),
    ...mapActions('data', ['resetData']),
    ...mapMutations('data', ['setFlows', 'setProjects']),
    ...mapActions('tenant', ['getTenants', 'setCurrentTenant']),
    ...mapMutations('sideNav', { closeSideNav: 'close' }),
    ...mapMutations('tenant', [
      'setDefaultTenant',
      'unsetTenants',
      'setTenants'
    ]),
    ...mapActions('user', ['getUser']),
    ...mapMutations('user', [
      'setInvitations',
      'unsetInvitations',
      'unsetUser'
    ]),
    ...mapMutations({ setUser: 'user/user' }),
    handleKeydown(e) {
      if (e.key === 'Escape') {
        this.closeSideNav()
      }
    },
    handleOffline() {
      // if the page isn't visible don't display a message
      if (document.hidden || document.msHidden || document.webkitHidden) return
    },
    handleOnline() {
      // if the page isn't visible don't display a message
      if (document.hidden || document.msHidden || document.webkitHidden) return
    },
    handleScroll: debounce(
      function() {
        if (this.$route.name == 'plans') return (this.showFooter = true)
        if (
          window.innerHeight + window.pageYOffset + 50 >=
          document.body.offsetHeight
        ) {
          this.showFooter = true
        } else this.showFooter = false
      },
      150,
      { leading: true, trailing: true }
    ),
    handleVisibilityChange() {
      this.currentInteraction = moment()

      if (this.currentInteraction.diff(this.lastInteraction) >= 600000) {
        this.wholeAppShown = false
        setTimeout(() => {
          this.wholeAppShown = true
        }, 0)
      } else if (this.currentInteraction.diff(this.lastInteraction) >= 300000) {
        this.shown = false
        setTimeout(() => {
          this.shown = true
        }, 0)
      }

      this.lastInteraction = this.currentInteraction
    },
    refresh() {
      let start

      const animationDuration = 150

      const loadTiles = time => {
        if (!start) start = time

        const elapsed = time - start

        if (elapsed > this.loadedComponents * animationDuration + 500) {
          this.loadedComponents++
        }

        if (this.loadedComponents <= this.numberOfComponents) {
          requestAnimationFrame(loadTiles)
        }
      }

      requestAnimationFrame(loadTiles)
    }
  }
}
</script>

<template>
  <v-app class="app">
    <v-main :class="{ 'pt-0': isWelcome }">
      <v-progress-linear absolute :active="loading" indeterminate height="5" />

      <WorkQueueBanner />

      <v-slide-y-transition>
        <ApplicationNavBar v-if="showNav" />
      </v-slide-y-transition>

      <TeamSideNav
        v-if="
          ((isCloud && isAuthenticated) || isServer) &&
            loadedComponents > 0 &&
            !isWelcome &&
            $route.name !== 'team-switched'
        "
      />

      <v-fade-transition mode="out-in">
        <router-view
          class="router-view"
          :class="{
            'full-page': fullPageRoute,
            'sm-and-down-bottom-padding': $vuetify.breakpoint.smAndDown
          }"
        />
      </v-fade-transition>

      <v-container v-if="error" class="fill-height" fluid justify-center>
        <v-card class="error--login">
          <v-card-text>{{ error }}</v-card-text>
        </v-card>
      </v-container>

      <GlobalSearch v-if="$vuetify.breakpoint.xsOnly && showNav" />

      <v-slide-y-reverse-transition>
        <Footer v-if="!fullPageRoute && showFooter && !isWelcome" />
      </v-slide-y-reverse-transition>
    </v-main>

    <Alert
      v-if="getAlert.alertShow"
      v-model="getAlert.alertShow"
      :type="getAlert.alertType"
      :message="getAlert.alertMessage"
      :alert-link="getAlert.alertLink"
      :link-text="getAlert.linkText"
      :nudge-bottom="paused"
      :timeout="12000"
      :alert-copy="getAlert.alertCopy"
    />

    <VSnackbars />
  </v-app>
</template>

<style lang="scss">
@font-face {
  font-family: “Source Code Pro”;
  src: url('assets/fonts/SourceCodePro-Regular.otf.woff2') format('woff2');
}

html {
  background-color: var(--v-appBackground-base) !important;
  font-size: 0.9rem !important;
  overflow-y: auto;
}

.app {
  background-color: var(--v-appBackground-base) !important;
}

.theme--light.v-app-bar {
  &.primary {
    background-image: linear-gradient(
      165deg,
      var(--v-primary-base),
      var(--v-prefect-base)
    );
  }

  &.secondary {
    background-image: linear-gradient(
      165deg,
      var(--v-secondary-base),
      var(--v-secondaryGray-base)
    );
  }
}

.link {
  text-decoration: none;

  &:hover,
  &:active,
  &:focus {
    text-decoration: underline;
  }
}

.router-view {
  height: auto;
  margin-bottom: 123px;
  max-width: 100% !important;
  min-height: calc(100vh - 64px - 123px);
  padding-bottom: 18px;
  transition: height none, opacity 250ms !important;

  &.full-page {
    margin-bottom: 0 !important;
  }

  &.sm-and-down-bottom-padding {
    // margin-bottom: 180px;
  }
}

.tab-full-height {
  min-height: 100%;
}

.v-overlay.v-overlay--active {
  backdrop-filter: blur(10px);
}
</style>
