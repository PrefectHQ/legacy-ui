<script>
import { mapGetters } from 'vuex'

export default {
  data() {
    return {}
  },
  computed: {
    ...mapGetters('tenant', ['tenant'])
  },
  watch: {},
  mounted() {},
  methods: {}
}
</script>

<template>
  <v-app>
    <v-navigation-drawer
      clipped
      left
      fixed
      permanent
      touchless
      :mini-variant="$vuetify.breakpoint.smAndDown"
      :style="{ top: $vuetify.breakpoint.smAndDown ? '56px' : '64px' }"
    >
      <template #prepend>
        <v-list-item>
          <v-list-item-action>
            <v-icon class="blue--text accent-4">
              settings
            </v-icon>
          </v-list-item-action>

          <v-list-item-content>
            <div class="font-weight-medium">
              User
            </div>
          </v-list-item-content>
        </v-list-item>
      </template>

      <v-divider />

      <v-list dense>
        <v-list-item :to="{ name: 'profile' }" ripple exact>
          <v-list-item-action>
            <v-icon>person</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Profile</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item
          data-cy="user-settings-personal-access-tokens"
          :to="{ name: 'user-tokens' }"
          ripple
          exact
        >
          <v-list-item-action>
            <v-icon>sync_alt</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Personal Access Tokens</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item :to="{ name: 'teams' }" ripple exact>
          <v-list-item-action>
            <v-icon>people</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>Your Teams</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <div
      :class="{
        'sm-and-down-left-padding': $vuetify.breakpoint.smAndDown,
        'sm-and-up-left-padding': $vuetify.breakpoint.smAndUp
      }"
    >
      <v-fade-transition mode="out-in">
        <router-view class="sub-router-view"></router-view>
      </v-fade-transition>
    </div>
  </v-app>
</template>

<style lang="scss" scoped>
.cursor-point {
  cursor: pointer;
}

.sm-and-up-left-padding {
  // Match left padding with User Settings sidebar width
  padding-left: 256px;
}

.sm-and-down-left-padding {
  // Match left padding with collapsed User Settings sidebar width
  padding-left: 56px;
}
</style>
