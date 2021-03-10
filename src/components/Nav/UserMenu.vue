<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  mixins: [formatTime],
  data() {
    return {
      clockInterval: null,
      model: false,
      routes: [
        {
          title: 'Profile',
          subtitle: 'Some details about what profile is',
          route: {
            name: 'profile'
          }
        },
        {
          title: 'Tokens',
          subtitle: 'Some details about what user tokens are',
          route: {
            name: 'user-tokens'
          }
        }
      ],
      time: Date.now()
    }
  },
  computed: {
    ...mapGetters('auth', ['isAuthorized']),
    ...mapGetters('user', ['user', 'oktaUser', 'isDark'])
  },
  mounted() {
    clearInterval(this.clock)
    this.clockInterval = setInterval(() => {
      this.time = Date.now()
    }, 1000)
  },
  methods: {
    ...mapActions('auth', ['logout']),
    ...mapMutations('user', ['setUserSettings']),
    async wipeClientAndLogout() {
      document.querySelector('.router-view').style.opacity = 0
      await this.logout(this.$apolloProvider.clients.defaultClient)
    },
    async toggleDarkMode() {
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark
      localStorage.setItem('dark_mode', this.$vuetify.theme.dark.toString())
      let settings = { isDark: this.$vuetify.theme.dark }
      settings = { ...this.user.settings, ...settings }
      this.setUserSettings(settings)

      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/User/update-user-settings.gql'),
          variables: {
            input: settings
          }
        })
        return true
      } catch (error) {
        this.handleAlert('error', 'Sorry, something went wrong!')
        return false
      }
    }
  }
}
</script>

<template>
  <v-menu
    v-model="model"
    offset-y
    data-cy="nav-bar-menu"
    transition="slide-y-transition"
    :close-on-content-click="false"
    nudge-bottom="15"
  >
    <template #activator="{ on }">
      <v-scale-transition>
        <v-btn
          class="white ml-3 mr-1"
          large
          icon
          title="Open the user menu"
          v-on="on"
        >
          <v-icon large color="grey">
            face
          </v-icon>
        </v-btn>
      </v-scale-transition>
    </template>

    <v-sheet width="300" class="pt-6 text-center">
      <div class="text-center">
        <v-avatar size="64" :tile="!oktaUser.picture">
          <img
            :src="
              oktaUser.picture ||
                require('@/assets/logos/logomark-cerulean.svg')
            "
            :alt="oktaUser.name"
          />
        </v-avatar>

        <div class="mt-2 text-h6">
          {{ user.first_name }} {{ user.last_name }}
        </div>
        <div class="caption"> {{ user.email }} </div>
      </div>

      <div
        v-ripple
        class="mx-auto my-4 py-2 px-6 text-center rounded-lg d-inline-block cursor-pointer"
        style="border: 2px solid var(--v-utilGrayMid-base);"
        @click="$router.push({ name: 'profile' })"
      >
        <div>
          <v-icon x-small>
            fad fa-cogs
          </v-icon>
          Account Settings
        </div>
        <div class="text-caption text--secondary text-truncate">
          Manage profile, access tokens, and teams
        </div>
      </div>
      <v-btn class="appBackground" @click="toggleDarkMode()">
        <span v-show="isDark"><v-icon>fad fa-lightbulb-on</v-icon></span>
        <span v-show="!isDark"><v-icon>fad fa-lightbulb</v-icon></span>
        <span class="ml-1">
          Switch to {{ isDark ? 'light' : 'dark' }} mode
        </span>
      </v-btn>

      <v-divider class="grey lighten-3 mx-auto my-2" style="width: 50%;" />

      <div class="my-4 text-h4 text-center primary--text">
        {{ datePartHour(time) }}<span class="utilGrayDark--text">:</span
        >{{ datePartMinute(time) }}
        <span class="text-overline utilGrayDark--text">
          {{ datePartMeridian(time) }}
        </span>

        <v-tooltip top>
          <template #activator="{ on }">
            <v-icon class="material-icons-outlined" x-small v-on="on">
              info
            </v-icon>
          </template>
          System time according to your set Timezone; you can change this from
          your Account Settings.
        </v-tooltip>
      </div>

      <!-- <v-divider class="grey lighten-3 mx-auto my-2" style="width: 50%;" /> -->

      <div>
        <!-- <MenuLink
          v-for="r in routes"
          :key="r.title"
          :primary="r.title"
          :secondary="r.subtitle"
          :route="r.route"
        /> -->

        <v-btn
          class="appBackground text-capitalize py-6"
          depressed
          block
          @click="wipeClientAndLogout"
        >
          <span class="mr-2">Sign out</span>
          <i class="fad fa-sign-out" />
        </v-btn>
      </div>
    </v-sheet>
  </v-menu>
</template>
