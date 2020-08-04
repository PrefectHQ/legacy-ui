<script>
import Alert from '@/components/Alert'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { stopDefaultClient, refreshDefaultClient } from '@/vue-apollo'
import moment from 'moment'
import NavBar from '@/components/NavBar'
import SideNav from '@/components/SideNav'

export default {
  components: {
    Alert,
    NavBar,
    SideNav
  },
  data() {
    return {
      appReady: false,
      error: null,
      loadedComponents: 0,
      numberOfComponents: 1,
      loadingKey: 0,
      reset: false,
      shown: true,
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
      'isAuthorizingUser'
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
    }
  },
  watch: {
    backend() {
      this.loadedComponents = 0
    },
    async connected(val) {
      if (!val) {
        stopDefaultClient()
      } else {
        refreshDefaultClient()

        // This catches scnearios where there's no tenant
        if (this.loadedComponents === 0) {
          this.refresh()
        }
      }
    },
    tenantIsSet(val) {
      if (val) {
        this.refresh()
      }
    }
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleKeydown)
    window.removeEventListener('offline', this.handleOffline)
    window.removeEventListener('online', this.handleOnline)

    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    )
    window.removeEventListener('blur', this.handleVisibilityChange)
    window.removeEventListener('focus', this.handleVisibilityChange)
  },
  mounted() {
    this.refresh()
  },
  async beforeRouteEnter(to, from, next) {
    await this.startup()
    this.appReady = true
    return next()
  },
  created() {
    this.monitorConnection()

    document.addEventListener('keydown', this.handleKeydown)
    window.addEventListener('offline', this.handleOffline)
    window.addEventListener('online', this.handleOnline)

    document.addEventListener(
      'visibilitychange',
      this.handleVisibilityChange,
      false
    )
    window.addEventListener('blur', this.handleVisibilityChange, false)
    window.addEventListener('focus', this.handleVisibilityChange, false)
  },
  methods: {
    ...mapActions('api', ['getApi', 'monitorConnection']),
    ...mapActions('auth0', ['authenticate', 'authorize']),
    ...mapActions('tenant', ['getTenants', 'setCurrentTenant']),
    ...mapActions('user', ['getUser']),
    ...mapMutations('tenant', ['setDefaultTenant']),

    ...mapMutations('sideNav', { closeSideNav: 'close' }),
    handleKeydown(e) {
      if (e.key === 'Escape') {
        this.closeSideNav()
      }
    },
    handleOffline() {
      // TODO: ADD APP BAR FOR CONNECTION STATUS
      // if the page isn't visible don't display a message
      if (document.hidden || document.msHidden || document.webkitHidden) return
    },
    handleOnline() {
      // TODO: ADD APP BAR FOR CONNECTION STATUS
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
      if (this.isCloud) {
        if (!this.isAuthenticated) await this.authenticate('app')
        if (!this.isAuthorized) await this.authorize('app')
        if (!this.userIsSet) await this.getUser('app')
      }

      try {
        await this.getTenants()

        if (this.isServer) {
          // If this is Server, there won't be a default tenant, so we'll set one
          this.setDefaultTenant(this.tenants?.[0])
        }

        if (this.defaultTenant?.id) {
          await this.setCurrentTenant(this.defaultTenant.slug)

          if (this.isCloud && !this.tenant.settings.teamNamed) {
            this.$router.push({
              name: 'welcome',
              params: {
                tenant: this.tenant.slug
              }
            })
          }
        }
      } catch {
        if (this.$route.name !== 'home') {
          this.$router.push({
            name: 'home'
          })
        }
      }
    },
    refresh() {
      this.loadedComponents = 0
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
  <v-app v-if="appReady" class="app">
    <v-main>
      <v-slide-y-transition>
        <NavBar v-if="loadedComponents > 0" />
      </v-slide-y-transition>

      <SideNav />
      <v-fade-transition mode="out-in">
        <router-view class="router-view" />
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
