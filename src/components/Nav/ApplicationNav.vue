<script>
import { mapGetters } from 'vuex'
import ConnectionMenu from '@/components/Nav/ConnectionMenu'
import GlobalSearch from '@/components/GlobalSearchBar/GlobalSearch'
import HelpMenu from '@/components/Nav/HelpMenu'
import NotificationMenu from '@/components/Nav/NotificationMenu'
import TeamMenu from '@/components/Nav/TeamMenu'
import TeamSideNavButton from '@/components/Nav/TeamSideNavButton'
import UserMenu from '@/components/Nav/UserMenu'

export default {
  components: {
    ConnectionMenu,
    GlobalSearch,
    HelpMenu,
    NotificationMenu,
    TeamMenu,
    TeamSideNavButton,
    UserMenu
  },
  data() {
    return {
      active: false,
      menu: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant'])
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
      <v-btn icon x-large>
        <img
          class="logo"
          src="@/assets/logos/logomark-white.svg"
          alt="The Prefect Logo"
        />
      </v-btn>
    </router-link>

    <TeamSideNavButton />

    <v-divider vertical class="white vertical-divider my-auto mx-2" />

    <v-btn
      :to="{
        name: 'dashboard',
        params: {
          tenant: tenant.slug
        }
      }"
      class="text-subtitle-1 text-capitalize mx-1 font-weight-medium"
      dark
      small
      depressed
      color="transparent"
    >
      Dashboard
    </v-btn>

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

    <v-btn
      :to="{
        name: 'calendar',
        params: { tenant: tenant.slug }
      }"
      class="text-subtitle-1 text-capitalize mx-1 font-weight-medium"
      dark
      small
      depressed
      color="transparent"
    >
      Calendar
    </v-btn>

    <TeamMenu />

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
  height: 100%;
}
</style>
