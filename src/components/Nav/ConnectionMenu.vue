<script>
import { mapActions, mapGetters } from 'vuex'
import ExternalLink from '@/components/ExternalLink'
import HavingTrouble from '@/components/HavingTrouble'
import { clearCache } from '@/vue-apollo'

export default {
  components: { ExternalLink, HavingTrouble },
  data() {
    return {
      backendTimeout: null,
      loading: false,
      model: false,
      value: this.backend
    }
  },
  computed: {
    ...mapGetters('api', [
      'backend',
      'isServer',
      'isCloud',
      'url',
      'apiMode',
      'connected',
      'connecting',
      'retries'
    ]),
    ...mapGetters('tenant', ['tenant']),
    iconClass() {
      if (this.apiMode == 'maintenance') return ['maintenance']
      if (this.connected) return ['connected']
      if (this.connecting) return ['connecting', 'connecting-animate']
      return ['disconnected']
    },
    statusColor() {
      if (this.apiMode == 'maintenance') return 'var(--v-warning-base)'
      if (this.connected) return 'var(--v-accentGreen-base)'
      if (this.connecting) return 'var(--v-warning-base)'
      return 'var(--v-Failed-base)'
    }
  },
  beforeDestroy() {
    clearTimeout(this.backendTimeout)
  },
  methods: {
    ...mapActions('api', ['switchBackend']),
    async _switchBackend(val) {
      if (val == this.backend) return

      clearTimeout(this.backendTimeout)
      this.loading = true

      this.backendTimeout = setTimeout(async () => {
        this.loading = false

        if (!this.isCloud) {
          await this.switchBackend('CLOUD')
        } else {
          await this.switchBackend('SERVER')
        }

        clearCache()
        this.handlePostTokenRouting()
      }, 2000)
    },
    handlePostTokenRouting() {
      if (this.isCloud && !this.tenant.settings.teamNamed) {
        this.$router.push({
          name: 'welcome',
          params: {
            tenant: this.tenant?.slug
          }
        })

        return
      } else {
        this.$router.push({
          name: 'dashboard',
          params: { tenant: this.tenant?.slug }
        })
      }
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
    :nudge-left="500"
    transition="slide-y-transition"
    nudge-bottom="20"
  >
    <template #activator="{ on }">
      <v-btn
        class="navbar-icon mx-1"
        :class="iconClass"
        icon
        title="Open the connection menu"
        v-on="on"
      >
        <i class="fad fa-server fa-2x nav-bar-duotone-icon" />
      </v-btn>
    </template>

    <v-sheet width="500" class="white">
      <v-alert
        border="left"
        colored-border
        tile
        :color="statusColor"
        class="text-body-1 mb-0"
      >
        <template slot="prepend">
          <div class="align-self-start" style="height: 100%;">
            <div
              class="navbar-icon mr-2 grey lighten-2 rounded-circle d-flex align-center justify-center"
              :class="iconClass"
              icon
            >
              <i class="fad fa-server fa-2x nav-bar-duotone-icon" />
            </div>
          </div>
        </template>

        <div class="mb-4 text-h5 d-flex align-bottom justify-start">
          <v-btn
            color="primary lighten-1"
            class="px-3 white--text font-weight-bold text-subtitle-1"
            depressed
            tile
            :outlined="isServer"
            :disabled="loading"
            style="width: 50%;"
            @click="_switchBackend('CLOUD')"
          >
            <img
              class="logo mr-2"
              style="opacity: 0.5;"
              src="@/assets/logos/cloud-logo-no-text.svg"
              :style="isCloud && 'filter: brightness(0) invert(1); opacity: 1;'"
            />
            Cloud
          </v-btn>

          <v-btn
            class="px-3 font-weight-bold text-subtitle-1"
            depressed
            tile
            :color="isServer ? 'primary' : 'utilGrayDark'"
            :outlined="isCloud"
            :disabled="loading"
            style="width: 50%;"
            @click="_switchBackend('SERVER')"
          >
            Server
            <img
              class="logo ml-2"
              src="@/assets/logos/core-logo-no-text.svg"
              style="opacity: 0.5;"
              :style="
                (isServer || $vuetify.theme.dark) &&
                  'filter: brightness(0) invert(1); opacity: 1;'
              "
            />
          </v-btn>
        </div>

        <v-divider class="grey lighten-3 my-5" style="width: 50%;" />

        <div class="mb-2 text-h6 font-weight-light">
          <span v-if="connected">Connected</span>
          <span v-else-if="connecting">Connecting</span>
          <span v-else>Couldn't connect</span>
          to
          <span class="font-weight-bold">
            <span v-if="isCloud" class="primary--text"
              >Prefect Cloud
              <span v-if="apiMode === 'maintenance'" class="primary--text">
                - In Maintenance</span
              ></span
            >
            <span v-else class="utilGrayDark--text">Prefect Server</span>
          </span>
          <span v-if="isServer">
            at
            <span class="font-weight-bold">{{ url }}</span>
          </span>
        </div>

        <!-- If the user is having trouble connecting to Server -->
        <div v-if="isServer && (!connected || connecting)">
          <HavingTrouble />
        </div>

        <!-- If the API is in maintenance mode -->
        <div v-if="apiMode == 'maintenance'">
          Prefect Cloud is undergoing routine maintenance; during this time no
          new runs will be released to your Agents and state updates may be
          delayed.
        </div>

        <div v-else-if="isCloud">
          Having trouble? Check out the
          <ExternalLink href="https://prefect.status.io/"
            >Prefect Cloud status page</ExternalLink
          >
          for information about upcoming maintenance windows and the current
          uptime of Prefect Cloud services.
        </div>
      </v-alert>
    </v-sheet>
  </v-menu>
</template>

<style lang="scss" scoped>
$primary-base: #fff; /* true in light and dark */
$secondary-base: var(--v-secondaryGrayLight-base);

$statuses: (
  'connected': var(--v-accentGreen-base),
  'connecting': var(--v-warning-base),
  'maintenance': var(--v-warning-base),
  'disconnected': var(--v-Failed-base)
);

@mixin duotone-colors($primary, $secondary) {
  --fa-primary-color: #{$primary};
  --fa-secondary-color: #{$secondary};
  --fa-primary-opacity: 1;
  --fa-secondary-opacity: 1;
}

@mixin keyframes($animation-name) {
  @keyframes #{$animation-name} {
    @content;
  }
}

@each $selector, $color in $statuses {
  @include keyframes(#{$selector}-swap) {
    from {
      @include duotone-colors($color, $primary-base);
    }

    to {
      @include duotone-colors($primary-base, $color);
    }
  }

  .#{$selector} {
    .svg-inline--fa {
      @include duotone-colors($primary-base, $color);
      transition: all 500ms;
    }

    &:hover,
    &:focus {
      .svg-inline--fa {
        @include duotone-colors($color, $primary-base);
        animation: unset !important;
      }
    }
  }

  .#{$selector}-animate {
    .svg-inline--fa {
      animation: #{$selector}-swap 2000ms linear infinite;
    }
  }
}

.logo {
  height: 24px;
  width: 24px;
}
</style>
