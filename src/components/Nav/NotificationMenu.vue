<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('api', ['connected']),
    ...mapGetters('tenant', ['tenant', 'tenantIsSet']),
    active() {
      return this.notificationsCount
    }
  },
  apollo: {
    notificationsCount: {
      query: require('@/graphql/Notifications/notifications-count-unread.gql'),
      loadingKey: 'loading',
      update: data => data?.message_aggregate?.aggregate?.count,
      fetchPolicy: 'no-cache',
      skip() {
        return !this.connected || !this.tenantIsSet
      },
      pollInterval: 10000
    }
  }
}
</script>

<template>
  <v-btn :to="{ name: 'notifications' }" class="navbar-icon mx-1" icon>
    <span class="fa-stack overflow-hidden" :class="{ active: active }">
      <i class="fad fa-circle nav-bar-duotone-icon fa-stack-1x fa-xs"></i>
      <i class="fad fa-bell nav-bar-duotone-icon fa-stack-2x"></i>
    </span>
  </v-btn>
</template>
