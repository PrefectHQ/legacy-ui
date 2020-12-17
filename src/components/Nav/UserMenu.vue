<script>
import { mapActions, mapGetters } from 'vuex'
import MenuLink from '@/components/Nav/MenuLink'

export default {
  components: {
    MenuLink
  },
  data() {
    return {
      model: true,
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
      ]
    }
  },
  computed: {
    ...mapGetters('auth0', ['isAuthorized']),
    ...mapGetters('user', ['user', 'auth0User', 'timezone'])
  },
  methods: {
    ...mapActions('auth0', ['logout']),
    trackAndLogout() {
      this.logout(this.$apolloProvider.clients.defaultClient)
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
        <v-btn class="white ml-3 mr-1" large icon v-on="on">
          <v-icon large color="grey">
            face
          </v-icon>
        </v-btn>
      </v-scale-transition>
    </template>

    <v-sheet width="250" class="pt-6">
      <div class="text-center">
        <v-avatar size="64">
          <img :src="auth0User.picture" :alt="auth0User.name" />
        </v-avatar>

        <div class="mt-2 text-h6">
          {{ user.first_name }} {{ user.last_name }}
        </div>
        <div class="caption"> {{ user.email }} </div>
      </div>

      <v-divider class="grey lighten-3 mx-auto my-2" style="width: 50%;" />

      <div>
        <MenuLink
          v-for="r in routes"
          :key="r.title"
          :primary="r.title"
          :secondary="r.subtitle"
          :route="r.route"
        />

        <v-btn
          class="text-capitalize py-6"
          depressed
          block
          @click="trackAndLogout"
        >
          <span class="mr-2">Sign out</span>
          <i class="fad fa-sign-out" />
        </v-btn>
      </div>
    </v-sheet>
  </v-menu>
</template>
