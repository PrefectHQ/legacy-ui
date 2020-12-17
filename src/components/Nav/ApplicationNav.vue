<script>
import { mapGetters } from 'vuex'
import ConnectionMenu from '@/components/Nav/ConnectionMenu'
import UserMenu from '@/components/Nav/UserMenu'

export default {
  components: { ConnectionMenu, UserMenu },
  data() {
    return {
      active: false,
      menu: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'tenants']),
    routes() {
      return [
        {
          text: 'Getting Started',
          route: {
            name: 'home'
          }
        },
        {
          text: 'Interactive API',
          route: {
            name: 'api',
            params: { tenant: this.tenant.slug }
          }
        },
        {
          text: 'Team',
          route: {
            name: 'team'
          }
        },
        {
          text: 'Tutorials',
          route: {
            name: 'tutorial'
          }
        }
      ]
    }
  }
}
</script>

<template>
  <v-app-bar app elevate-on-scroll fixed color="primary">
    <router-link
      :to="{
        name: 'dashboard',
        params: {
          tenant: tenant.slug
        }
      }"
    >
      <v-btn color="primary" text icon large>
        <img
          class="logo"
          style="pointer-events: none;"
          src="@/assets/logos/logomark-white.svg"
          alt="The Prefect Logo"
        />
      </v-btn>
    </router-link>

    <div
      class="text-subtitle-1 font-weight-medium white--text d-flex align-center justify-start px-4"
      style="height: 100%;"
    >
      <div style="font-size: 1.05rem;">{{ tenant.name }}</div>
      <v-icon color="grey lighten-3">arrow_drop_down</v-icon>
    </div>

    <v-divider vertical class="white vertical-divider my-auto mr-2" />

    <v-btn
      v-for="r in routes"
      :key="r.text"
      :to="r.route"
      class="text-subtitle-1 text-capitalize mx-1 font-weight-medium"
      dark
      small
      depressed
      color="transparent"
    >
      {{ r.text }}
    </v-btn>

    <v-spacer></v-spacer>

    <v-btn class="navbar-icon mx-1" icon>
      <i class="fad fa-search fa-2x nav-bar-duotone-icon" />
    </v-btn>

    <v-btn class="navbar-icon mx-1" icon>
      <i
        class="fad fa-question-circle nav-bar-duotone-icon fa-2x white--text"
      />
    </v-btn>

    <v-btn class="navbar-icon mx-1" icon @click="active = !active">
      <span class="fa-stack" :class="{ active: active }">
        <i class="fad fa-circle nav-bar-duotone-icon fa-stack-1x fa-xs"></i>
        <i class="fad fa-bell nav-bar-duotone-icon fa-stack-2x"></i>
      </span>
    </v-btn>

    <ConnectionMenu />

    <UserMenu />
  </v-app-bar>
</template>

<style lang="scss" scoped>
.vertical-divider {
  height: 50%;
  min-height: 0;
  opacity: 0.5;
}

.logo {
  width: 1rem;
}

.navbar-icon {
  font-size: 0.85rem;
  height: 36px !important;
  width: 36px !important;

  .svg-inline--fa {
    --fa-primary-color: #fff;
    --fa-secondary-color: #efefef;
    transition: all 150ms linear;

    &.fa-search {
      --fa-primary-color: #efefef;
      --fa-secondary-color: #fff;
      --fa-secondary-opacity: 1;
    }

    &.fa-bell {
      --fa-primary-color: #efefef;
      --fa-secondary-color: #fff;
      --fa-secondary-opacity: 1;
    }

    &.fa-server {
      --fa-secondary-opacity: 0.5;
    }

    &.fa-circle {
      --fa-secondary-color: #fff;
      --fa-secondary-opacity: 0;
      height: 0;
      width: 0;
    }
  }

  &:hover,
  &:focus {
    .svg-inline--fa {
      --fa-primary-color: var(--v-accentPink-base);
    }
  }
}

.fa-stack {
  &.active {
    .nav-bar-duotone-icon {
      --fa-primary-color: var(--v-accentPink-base);
    }

    .fa-stack-1x {
      height: 100%;
      left: 50%;
      transform: translate(-50%, 1.15em) scale(0.6);
      width: 100%;
    }
  }
}
</style>
