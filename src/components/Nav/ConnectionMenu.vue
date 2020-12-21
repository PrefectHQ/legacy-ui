<script>
import { mapActions, mapGetters } from 'vuex'
import ExternalLink from '@/components/ExternalLink'
import { clearCache } from '@/vue-apollo'

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
  components: { ExternalLink },
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
      if (this.connected) return ['connected']
      if (this.connecting) return ['connecting', 'connecting-animate']
      return ['disconnected']
    },
    statusColor() {
      if (this.connected) return '#06e797'
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
      <v-btn class="navbar-icon mx-1" :class="iconClass" icon v-on="on">
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
            color="secondary lighten-2"
            class="px-3 white--text font-weight-bold text-subtitle-1"
            depressed
            tile
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
                isServer && 'filter: brightness(0) invert(1); opacity: 1;'
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
            <span v-if="isCloud" class="primary--text">Prefect Cloud</span>
            <span v-else class="secondaryGray--text">Prefect Server</span>
          </span>
          <span v-if="isServer">
            at
            <span class="font-weight-bold">{{ url }}</span>
          </span>
        </div>

        <!-- If the user is having trouble connecting to Server -->
        <div v-if="isServer && (!connected || connecting)">
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

            for tips on setting up Prefect Server, idioms for writing flows, and
            so much more. Looking for more in-depth discussion? Our
            <ExternalLink
              href="https://github.com/PrefectHQ/prefect/discussions/new"
              >GitHub Discussion board</ExternalLink
            >
            is a great place to present long-form ideas, technical challenges,
            or to show off your Prefect tasks and flows!

            <div class="mt-4"
              >Did you know that

              <ExternalLink href="https://www.prefect.io/cloud"
                >Prefect Cloud</ExternalLink
              >
              offers a feature-rich and fully-managed orchestration layer for
              your flows? Oh and it's also <em>free</em>.
            </div>
          </div>
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
$primary-base: #fff;
$secondary-base: #efefef;

$statuses: (
  'connected': #06e797,
  'connecting': var(--v-warning-base),
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
