<script>
/* eslint-disable */
import { mapGetters } from 'vuex'
import CardTitle from '@/components/Card-Title'

// Notification type-specific components
import ApprovalNotification from '@/pages/Notifications/NotificationTypes/Approval-Notification'
import FlowRunNotification from '@/pages/Notifications/NotificationTypes/FlowRun-Notification'
import MembershipNotification from '@/pages/Notifications/NotificationTypes/Membership-Notification'
import WhatsNewNotification from '@/pages/Notifications/NotificationTypes/WhatsNew-Notification'

import {
  componentMap,
  iconMap,
  iconColorMap,
  navigationMap
} from '@/pages/Notifications/utils'

export default {
  components: {
    ApprovalNotification,
    CardTitle,
    FlowRunNotification,
    MembershipNotification,
    WhatsNewNotification
  },
  data() {
    return {
      loadingKey: 0
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    cardTitle() {
      return `${parseInt(
        this.notificationsCount
      ).toLocaleString()} Recent notification${
        this.notificationsCount === 1 ? '' : 's'
      }`
    },
    isLoading() {
      return this.loadingKey > 0
    },
    where() {
      let where = {
        tenant_id: { _eq: this.tenant?.id }
      }

      if (this.read !== 0) {
        where.read = { _eq: this.read }
      }
      return where
    }
  },
  methods: {
    notificationComponent(type) {
      return componentMap[type]
    },
    notificationIcon(type) {
      return iconMap[type]
    },
    notificationIconColor(type, n) {
      return iconColorMap[type](n)
    },
    notificationNavigation(notification) {
      return navigationMap[notification.type](notification, this.tenant)
    }
  },
  apollo: {
    notifications: {
      query() {
        return require('@/graphql/Notifications/notifications.js').default(
          this.isCloud
        )
      },
      variables() {
        return {
          limit: this.limit,
          offset: this.limit * (this.page - 1),
          orderBy: { created: 'desc' },
          where: this.where
        }
      },
      loadingKey: 'loading',
      update: data => data.notifications,
      pollInterval: 5000,
      fetchPolicy: 'network-only'
    },
    notificationsCount: {
      query: require('@/graphql/Notifications/notifications-count.gql'),
      loadingKey: 'loading',
      variables() {
        return {
          where: this.where
        }
      },
      update: data => data?.message_aggregate?.aggregate?.count,
      pollInterval: 5000,
      fetchPolicy: 'network-only'
    }
  }
}
</script>

<template>
  <v-card class="py-2 position-relative" style="height: 330px;" tile>
    <CardTitle
      :title="cardTitle"
      icon="notifications"
      icon-class="mb-1"
      :loading="isLoading"
    />

    <v-list class="card-content">
      This is where i'd put notificaitons...
    </v-list>

    <v-card-actions>
      <v-spacer />
      <v-btn small color="primary" text>
        View all notifications
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.card-content {
  height: 100%;
  max-height: 210px;
  overflow-y: scroll;
}
</style>
