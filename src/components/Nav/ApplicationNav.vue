<script>
import { mapGetters } from 'vuex'
import ConnectionMenu from '@/components/Nav/ConnectionMenu'
import GlobalSearch from '@/components/GlobalSearchBar/GlobalSearch'
import HelpMenu from '@/components/Nav/HelpMenu'
import NotificationMenu from '@/components/Nav/NotificationMenu'
import TeamMenu from '@/components/Nav/TeamMenu'
import UserMenu from '@/components/Nav/UserMenu'

export default {
  components: {
    ConnectionMenu,
    GlobalSearch,
    HelpMenu,
    NotificationMenu,
    TeamMenu,
    UserMenu
  },
  data() {
    return {
      active: false,
      menu: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'tenants'])
    // routes() {
    //   return [
    //     {
    //       text: 'Getting Started',
    //       route: {
    //         name: 'home'
    //       }
    //     },
    //     {
    //       text: 'Interactive API',
    //       route: {
    //         name: 'api',
    //         params: { tenant: this.tenant.slug }
    //       }
    //     },
    //     {
    //       text: 'Team',
    //       route: {
    //         name: 'team'
    //       }
    //     },
    //     {
    //       text: 'Tutorials',
    //       route: {
    //         name: 'tutorial'
    //       }
    //     }
    //   ]
    // }
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
      :to="{
        name: 'home'
      }"
      class="text-subtitle-1 text-capitalize mx-1 font-weight-medium"
      dark
      small
      depressed
      color="transparent"
    >
      Getting Started
    </v-btn>

    <v-btn
      :to="{
        name: 'api',
        params: { tenant: tenant.slug }
      }"
      class="text-subtitle-1 text-capitalize mx-1 font-weight-medium"
      dark
      small
      depressed
      color="transparent"
    >
      Interactive API
    </v-btn>

    <TeamMenu />

    <!-- <v-btn
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
    </v-btn> -->

    <v-spacer></v-spacer>

    <GlobalSearch />

    <HelpMenu />

    <NotificationMenu />

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
</style>
