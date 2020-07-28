<script>
import Alert from '@/components/Alert'
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { defaultApolloClient } from '@/vue-apollo'
import moment from 'moment'
import NavBar from '@/components/NavBar'
import SideNav from '@/components/SideNav'
// import SideDrawer from '@/components/SideDrawer'
// import SideDrawerOpenButton from '@/components/SideDrawerOpenButton'

export default {
  components: {
    Alert,
    NavBar,
    SideNav
    // SideDrawer,
    // SideDrawerOpenButton
  },
  data() {
    return {
      error: null,
      loadingKey: 0,
      reset: false,
      shown: true,
      wholeAppShown: true
    }
  },
  computed: {
    ...mapGetters('api', ['backend', 'version', 'url', 'connected']),
    ...mapGetters('alert', ['getAlert']),
    ...mapGetters('auth0', ['isAuthenticated', 'isAuthorized']),
    ...mapGetters('tenant', ['tenant']),
    notFoundPage() {
      return this.$route.name === 'not-found'
    },
    isCloud() {
      return this.backend == 'CLOUD'
    }
  },
  watch: {
    backend() {
      this.$apollo.skipAll = true
      setTimeout(() => {
        this.$apollo.skipAll = false
      }, 500)
    },
    connected(val) {
      // Stops vue-related queries by stopping the client entirely
      // when we're not connected. This does not impact the api store,
      // which is using a separate client to check api status.
      if (!val) {
        defaultApolloClient.stop()
      } else {
        defaultApolloClient.restore()
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
  async created() {
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
    // ...mapMutations('sideDrawer', {
    //   clearDrawer: 'clearDrawer',
    //   closeSideDrawer: 'close'
    // }),
    ...mapMutations('sideNav', { closeSideNav: 'close' }),
    handleKeydown(e) {
      if (e.key === 'Escape') {
        this.closeSideDrawer()
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
    }
  }
}
</script>

<template>
  <v-app v-if="wholeAppShown" class="app">
    <v-main>
      <NavBar />
      <SideNav />
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
    <!-- <SideDrawer /> -->
    <!-- <SideDrawerOpenButton /> -->
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
