<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('api', ['connected']),
    ...mapGetters('auth', ['isAuthorized']),
    ...mapGetters('tenant', ['tenant', 'tenantIsSet']),
    active() {
      return this.notificationsCount
    }
  },
  methods: {
    onIntersect([entry]) {
      this.$apollo.queries.notificationsCount.skip = !entry.isIntersecting
    }
  },
  apollo: {
    notificationsCount: {
      query: require('@/graphql/Notifications/notifications-count-unread.gql'),
      loadingKey: 'loading',
      update: data => data?.message_aggregate?.aggregate?.count,
      fetchPolicy: 'no-cache',
      skip() {
        return !this.connected || !this.tenantIsSet || !this.isAuthorized
      },
      pollInterval: 10000
    }
  }
}
</script>

<template>
  <v-btn
    v-intersect="{ handler: onIntersect }"
    :to="'/notifications'"
    class="navbar-icon mx-1"
    icon
    title="Navigation to your notifications page"
  >
    <span class="fa-stack" :class="{ active: active }">
      <i
        class="fad fa-circle nav-bar-duotone-icon fa-stack-1x fa-xs overflow-hidden"
      ></i>
      <i class="fad fa-bell nav-bar-duotone-icon fa-stack-2x"></i>
    </span>
  </v-btn>
</template>
