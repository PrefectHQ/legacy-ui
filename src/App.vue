<script>
import Alert from '@/components/Alert'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { clearCache } from '@/vue-apollo'
import moment from 'moment'
import NavBar from '@/components/NavBar'
import SideNav from '@/components/SideNav'
import { eventsMixin } from '@/mixins/eventsMixin'

export default {
  components: {
    Alert,
    NavBar,
    SideNav
  },
  mixins: [eventsMixin],
  data() {
    return {
      error: null,
      loadedComponents: 0,
      numberOfComponents: 1,
      loadingKey: 0,
      refreshTimeout: null,
      reset: false,
      shown: false,
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
      'tenantIsSet'
    ]),
    ...mapGetters('user', ['userIsSet']),
    notFoundPage() {
      return this.$route.name === 'not-found'
    },
    isCloud() {
      return this.backend == 'CLOUD'
    },
    isWelcome() {
      return (
        this.$route.name === 'welcome' ||
        this.$route.name === 'onboard-resources' ||
        this.$route.name === 'name-team'
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
    },
    async connected(val) {
      if (val) {
        clearCache()
      }
    },
    tenant(val) {
      if (val?.id) {
        clearTimeout(this.refreshTimeout)
        this.refresh()
        this.$apollo.queries.agents.refresh()
      }
    },
    isAuthorized(val) {
      if (val) {
        if (!this.startupHasRun) {
          this.startup()
        } else {
          this.shown = true
        }
      }
    },
    agents(val) {
      this.setAgents(val)
    },
    async $route(new_route, old_route) {
      if (
        new_route?.params?.tenant &&
        new_route?.params?.tenant !== old_route?.params?.tenant &&
        this.tenant?.slug !== new_route.params.tenant
      ) {
        await this.setCurrentTenant(new_route.params.tenant)
      }
    }
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown)
    window.removeEventListener('offline', this.handleOffline)
    window.removeEventListener('online', this.handleOnline)

    // document.removeEventListener(
    //   'visibilitychange',
    //   this.handleVisibilityChange
    // )
    // window.removeEventListener('blur', this.handleVisibilityChange)
    // window.removeEventListener('focus', this.handleVisibilityChange)
  },
  mounted() {
    if (!this.isCloud || (this.isAuthenticated && this.isAuthorized)) {
      this.shown = true
      if (!this.startupHasRun) {
        this.startup()
      }
    }
    this.refresh()
  },
  async beforeMount() {
    if ((this.isServer || this.isAuthorized) && !this.startupHasRun) {
      await this.startup()
    }

    this.monitorConnection()

    document.addEventListener('keydown', this.handleKeydown)
    window.addEventListener('offline', this.handleOffline)
    window.addEventListener('online', this.handleOnline)

    // document.addEventListener(
    //   'visibilitychange',
    //   this.handleVisibilityChange,
    //   false
    // )
    // window.addEventListener('blur', this.handleVisibilityChange, false)
    // window.addEventListener('focus', this.handleVisibilityChange, false)
  },
  methods: {
    ...mapActions('api', ['getApi', 'monitorConnection']),
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
    async startup() {
      this.startupHasRun = true

      try {
        if (this.isCloud) {
          if (!this.isAuthorized) {
            await this.authorize()
          }

          if (!this.userIsSet) {
            await this.getUser()
          }
        }

        await this.getApi()

        await this.getTenants()

        if (this.isServer && !this.tenants?.length) {
          // Server has no tenants so redirect to home
          if (this.$route.name !== 'home') {
            await this.$router.push({
              name: 'home'
            })
          }
        }

        if (this.isServer && this.tenants?.length) {
          // If this is Server, there won't be a default tenant, so we'll set one
          this.setDefaultTenant(this.tenants?.[0])
        }

        if (this.defaultTenant?.id) {
          await this.setCurrentTenant(this.defaultTenant.slug)

          if (this.isCloud && !this.tenant.settings.teamNamed) {
            await this.$router.push({
              name: 'welcome',
              params: {
                tenant: this.tenant.slug
              }
            })
          }
        }
      } catch {
        if (this.$route.name !== 'home') {
          await this.$router.push({
            name: 'home'
          })
        }
      } finally {
        this.shown = true

        // if (!this.$route.params.tenant) {
        //   this.$router.replace({
        //     params: {
        //       tenant: this.tenant.slug
        //     }
        //   })
        // }
      }
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
      loadingKey: 'loading',
      pollInterval: 3000,
      skip() {
        return !this.tenant.id
      },
      update: data => {
        return data.agent
      }
    }
  }
}
</script>

<template>
  <v-app class="app">
    <v-main :class="{ 'pt-0': isWelcome }">
      <v-progress-linear
        absolute
        :active="isLoggingInUser"
        indeterminate
        height="5"
      />

      <v-slide-y-transition>
        <NavBar v-if="shown && loadedComponents > 0" />
      </v-slide-y-transition>

      <SideNav v-if="shown" />
      <v-fade-transition mode="out-in">
        <router-view v-if="shown" class="router-view" />
      </v-fade-transition>

      <v-container v-if="error" class="fill-height" fluid justify-center>
        <v-card class="error--login">
          <v-card-text>{{ error }}</v-card-text>
        </v-card>
      </v-container>
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
  max-width: 100% !important;
}
</style>
