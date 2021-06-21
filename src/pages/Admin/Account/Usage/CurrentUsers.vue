<script>
import { mapGetters } from 'vuex'
export default {
  data() {
    return {
      count: null,
      loadingKey: 0
    }
  },
  computed: {
    ...mapGetters('license', ['license', 'hasPermission']),
    loading() {
      return this.loadingKey > 0 || (!this.count && this.count !== 0)
    }
  },
  apollo: {
    memberships: {
      query() {
        return this.hasPermission('license', 'admin') && this.license
          ? require('@/graphql/Account/license-users.gql')
          : require('@/graphql/TeamSettings/memberships.gql')
      },
      loadingKey: 'loadingKey',
      result({ data }) {
        if (!data) return
        if (this.hasPermission('license', 'admin') && this.license) {
          this.count = data.license_users?.length
        } else {
          this.count =
            data.memberships.filter(m => m.account_type !== 'SERVICE').length +
            data.membershipInvitations.length
        }
      },
      fetchPolicy: 'no-cache'
    }
  }
}
</script>

<template>
  <v-card tile class="f-wh py-8 d-flex flex-column align-center justify-center">
    <div class="rounded pa-3 primary">
      <v-icon x-large color="white">
        fad fa-users
      </v-icon>
    </div>

    <div class="text-center">
      <div class="text-subtitle-1 text--disabled">Users</div>

      <v-skeleton-loader
        :loading="loading"
        type="image"
        transition="quick-fade"
        height="36"
        tile
      >
        <div class="text-h4">
          {{ count }}
        </div>
      </v-skeleton-loader>
    </div>
  </v-card>
</template>

<style lang="scss" scoped>
.f-wh {
  height: 100%;
  width: 100%;
}
</style>
