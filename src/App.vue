<script>
import Alert from '@/components/Alert'
import Footer from '@/components/Footer'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { clearCache } from '@/vue-apollo'
import moment from 'moment'
import NavBar from '@/components/NavBar'
import SideNav from '@/components/SideNav'
import { eventsMixin } from '@/mixins/eventsMixin'
import debounce from 'lodash.debounce'

const SERVER_KEY = `${process.env.VUE_APP_RELEASE_TIMESTAMP}_server_url`

const fullPageRoutes = ['api', '404']

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
    Footer,
    NavBar,
    SideNav
  },
  mixins: [eventsMixin],
  data() {
    return {
      error: null,
      footerTimeout: null,
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
    ...mapGetters('auth0', [
      'isAuthenticated',
      'isAuthorized',
      'isAuthenticatingUser',
      'isAuthorizingUser',
      'isLoggingInUser'
    ]),
    ...mapGetters('tenant', [
      'tenant',
      'tenants',
      'defaultTenant',
      'tenantIsSet',
      'isLoadingTenant'
    ]),
    ...mapGetters('user', ['userIsSet']),
    notFoundPage() {
      return this.$route.name === 'not-found'
    },
    fullPageRoute() {
      return fullPageRoutes.includes(this.$route.name)
    },
    loading() {
      return (
        this.isAuthorizingUser ||
        this.isLoggingInUser ||
        this.connecting ||
        this.isLoadingTenant
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
    }
  },
  watch: {
    backend() {
      this.loadedComponents = 0
      this.shown = false

      this.refreshTimeout = setTimeout(() => {
        this.shown = true
        this.refresh()
        clearTimeout(this.refreshTimeout)
      }, 3000)
      this.setAgents(null)
    },
    async connected(val) {
      if (val) {
        clearCache()
      }
    },
    tenant(val) {
      if (val?.id) {
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
        this.$apollo.queries.agents.refresh()
      }
    },
    agents(val) {
      this.setAgents(val)
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
      }
    }
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown)
    window.removeEventListener('offline', this.handleOffline)
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('mousewheel', this.handleScroll)
    // document.removeEventListener('mousemove', this.handleMouseMove)

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
  },
  async beforeMount() {
    document.addEventListener('keydown', this.handleKeydown)
    window.addEventListener('offline', this.handleOffline)
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('mousewheel', this.handleScroll)
    // document.addEventListener('mousemove', this.handleMouseMove)

    // document.addEventListener(
    //   'visibilitychange',
    //   this.handleVisibilityChange,
    //   false
    // )
    // window.addEventListener('blur', this.handleVisibilityChange, false)
    // window.addEventListener('focus', this.handleVisibilityChange, false)
  },
  methods: {
    ...mapActions('api', ['getApi', 'monitorConnection', 'setServerUrl']),
    ...mapActions('auth0', ['authenticate', 'authorize']),
    ...mapActions('tenant', ['getTenants', 'setCurrentTenant']),
    ...mapActions('user', ['getUser']),
    ...mapMutations('tenant', ['setDefaultTenant']),
    ...mapMutations('agent', ['setAgents']),
    ...mapMutations('sideNav', { closeSideNav: 'close' }),
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
    handleMouseMove(e) {
      if (e.pageY >= document.body.clientHeight - 185) {
        this.showFooter = true
      } else {
        this.showFooter = false
      }
    },
    handleScroll: debounce(
      function() {
        console.log(
          window.innerHeight,
          window.pageYOffset,
          document.body.offsetHeight
        )
        if (
          window.innerHeight + window.pageYOffset >=
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
  },
  apollo: {
    agents: {
      query() {
        return require('@/graphql/Agent/agents.js').default(this.isCloud)
      },
      skip() {
        return this.isCloud && !this.isAuthorized
      },
      pollInterval: 3000,
      //Without this, server UI with no actual server shows results
      fetchPolicy: 'no-cache',
      update: data => data.agent ?? null
    }
  }
}
</script>

<template>
  <v-app class="app">
    <v-main :class="{ 'pt-0': isWelcome }">
      <v-progress-linear absolute :active="loading" indeterminate height="5" />

      <v-slide-y-transition>
        <NavBar
          v-if="
            ((isCloud && isAuthenticated) || isServer) && loadedComponents > 0
          "
        />
      </v-slide-y-transition>

      <SideNav />

      <v-fade-transition mode="out-in">
        <router-view
          class="router-view"
          :class="{ 'full-page': fullPageRoute }"
        />
      </v-fade-transition>

      <v-container v-if="error" class="fill-height" fluid justify-center>
        <v-card class="error--login">
          <v-card-text>{{ error }}</v-card-text>
        </v-card>
      </v-container>

      <v-slide-y-reverse-transition>
        <Footer v-if="!fullPageRoute && showFooter" />
      </v-slide-y-reverse-transition>
    </v-main>

    <Alert
      v-if="getAlert.alertShow"
      v-model="getAlert.alertShow"
      :type="getAlert.alertType"
      :message="getAlert.alertMessage"
      :alert-link="getAlert.alertLink"
      :link-text="getAlert.linkText"
      :timeout="12000"
    />
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
  color: #0f4880;
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
  transition: height none !important;

  &.full-page {
    margin-bottom: 0 !important;
  }
}

.tab-full-height {
  min-height: 100%;
}
</style>
