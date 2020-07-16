<script>
import { mapMutations, mapGetters } from 'vuex'

export default {
  data() {
    return {
      removeTeamDialog: false,
      teamName: null,
      nameMatches: false,
      deleteTenantTimeout: null,
      deleteTenantLoading: false,
      deleteTenantError: null
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant'])
  },
  watch: {},
  mounted() {},
  methods: {
    ...mapMutations('tenant', ['setTenant', 'unsetTenant']),
    closeTeamDialog() {
      this.removeTeamDialog = false
      this.teamName = null
      this.nameMatches = false
      this.deleteTenantLoading = false
      this.deleteTenantError = null
      clearTimeout(this.deleteTenantTimeout)
    },
    checkName(val) {
      this.deleteTenantError = false
      this.nameMatches = val == this.tenant.name
    },
    async deleteTenant() {
      clearTimeout(this.deleteTenantTimeout)
      this.deleteTenantLoading = true
      const deleteTenant = await this.$apollo.mutate({
        mutation: require('@/graphql/Tenant/delete-tenant.gql'),
        variables: {
          id: this.tenant.id
        }
      })
      this.deleteTenantTimeout = setTimeout(() => {
        this.deleteTenantLoading = false
        this.teamName = null
        this.nameMatches = false
        if (deleteTenant.data && deleteTenant.data.deleteTenant.success) {
          this.unsetTenant()
          this.$router.push({ name: 'dashboard' })
        } else {
          this.deleteTenantError = 'Something went wrong.'
        }
      }, 750)
    }
  }
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
      <template v-slot:prepend>
        <v-list-item>
          <v-list-item-action>
            <v-icon class="blue--text accent-4">
              settings
            </v-icon>
          </v-list-item-action>

          <v-list-item-content>
            <div class="font-weight-medium">
              User Settings
            </div>
          </v-list-item-content>
        </v-list-item>
      </template>

      <v-divider />

      <v-list dense>
        <v-list-item :to="{ name: 'userprofile' }" ripple exact>
          <v-list-item-action>
            <v-icon>person</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>User Profile</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-list-item
          data-cy="user-settings-personal-access-tokens"
          :to="{ name: 'personal-access-tokens' }"
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
      </v-list>
    </v-navigation-drawer>
    <div
      :class="{
        'sm-and-down-left-padding': $vuetify.breakpoint.smAndDown,
        'sm-and-up-left-padding': $vuetify.breakpoint.smAndUp
      }"
      style="min-height: 100%;"
    >
      <v-fade-transition mode="out-in">
        <router-view></router-view>
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
