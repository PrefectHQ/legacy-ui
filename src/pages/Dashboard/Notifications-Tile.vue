<script>
import { mapGetters } from 'vuex'
import CardTitle from '@/components/Card-Title'
import { formatTime } from '@/mixins/formatTimeMixin'
import gql from 'graphql-tag'

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
  mixins: [formatTime],
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
      ).toLocaleString()} unread notification${
        this.notificationsCount === 1 ? '' : 's'
      }`
    },
    iconColor() {
      return this.isLoading
        ? null
        : this.notificationsCount > 0
        ? 'codePink'
        : null
    },
    isLoading() {
      return this.loadingKey > 0
    },
    where() {
      let where = {
        tenant_id: { _eq: this.tenant?.id },
        read: { _eq: false }
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
    },
    routeToNotifications() {
      this.$router.push({
        name: 'notifications'
      })
    }
  },
  async beforeRouteLeave(to, from, next) {
    if (!to.query?.notification_id) return next()

    try {
      if (to.query?.notification_id) {
        let mutationString = gql`
        mutation MarkMessagesAsRead {
          mark_message_as_read(input: { message_id: "${to.query.notification_id}" }) {
            success
            error
          }
        }
      `
        await this.$apollo.mutate({
          mutation: mutationString
        })

        delete to.query.notification_id
      }
    } finally {
      next({ name: to.name, params: to.params })
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
          limit: 5,
          orderBy: { created: 'desc' },
          where: this.where
        }
      },
      loadingKey: 'loadingKey',
      update: data => data.notifications,
      pollInterval: 5000,
      fetchPolicy: 'network-only'
    },
    notificationsCount: {
      query: require('@/graphql/Notifications/notifications-count.gql'),
      loadingKey: 'loadingKey',
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
      :icon-color="iconColor"
      icon-class="mb-1"
      :loading="isLoading"
    />

    <v-card-text class="pa-0 card-content">
      <v-skeleton-loader v-if="isLoading" type="list-item-three-line">
      </v-skeleton-loader>

      <v-list>
        <template v-for="(n, i) in notifications">
          <v-list-item
            :key="n.id"
            class="position-relative"
            :class="n.read ? 'o-60 hover-o-100' : ''"
            :disabled="isLoading > 0"
            :to="notificationNavigation(n)"
            exact
          >
            <v-list-item-avatar class="mx-2 pa-0">
              <v-icon :color="notificationIconColor(n.type, n)">
                {{ n.content.icon ? n.content.icon : notificationIcon(n.type) }}
              </v-icon>
            </v-list-item-avatar>

            <component
              :is="notificationComponent(n.type)"
              :content="n.content"
              :read="n.read"
            />

            <v-list-item-action class="o-100">
              <v-list-item-action-text>
                {{ formatDateTime(n.created) }}
              </v-list-item-action-text>
            </v-list-item-action>
          </v-list-item>
          <v-divider v-if="i + 1 < notifications.length" :key="i"></v-divider>
        </template>
      </v-list>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn small color="primary" text :to="{ name: 'notifications' }">
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
