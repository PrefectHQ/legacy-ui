<script>
import { mapGetters } from 'vuex'
import ExternalLink from '@/components/ExternalLink'

export default {
  components: { ExternalLink },
  data() {
    return {
      model: false
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
    buttonClass() {
      if (this.connected) return ['connected']
      if (this.connecting) return ['connecting', 'connecting-animate']
      return ['disconnected']
    }
  }
}
</script>

<template>
  <v-menu
    v-model="model"
    :close-on-content-click="false"
    offset-y
    transition="slide-y-transition"
    nudge-bottom="15"
  >
    <template #activator="{ on }">
      <!-- <v-btn
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
      </v-btn> -->

      <v-btn class="navbar-icon mx-1" :class="buttonClass" icon v-on="on">
        <i class="fad fa-server fa-2x nav-bar-duotone-icon" />
      </v-btn>
    </template>

    <v-sheet width="500" class="white">
      <v-alert
        border="left"
        colored-border
        icon="fad fa-clouds"
        tile
        color="primary"
        class="text-body-1"
      >
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
              href="https://github.com/PrefectHQ/prefect/discussions/category_choices"
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
      </v-alert>
    </v-sheet>

    <!-- <v-card
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
        <v-btn small text @click="model = false">
          Close
        </v-btn>
      </v-card-actions>
    </v-card> -->
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
</style>
