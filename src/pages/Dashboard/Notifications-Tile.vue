<script>
import { mapGetters } from 'vuex'
import CardTitle from '@/components/Card-Title'
import { formatTime } from '@/mixins/formatTimeMixin'

// Notification type-specific components
import ApprovalNotification from '@/pages/Notifications/NotificationTypes/Approval-Notification'
import FlowRunNotification from '@/pages/Notifications/NotificationTypes/FlowRun-Notification'
import MembershipNotification from '@/pages/Notifications/NotificationTypes/Membership-Notification'
import MessageNotification from '@/pages/Notifications/NotificationTypes/Message-Notification'
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
    MessageNotification,
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
        _or: [
          { tenant_id: { _eq: this.tenant?.id } },
          { tenant_id: { _is_null: true } }
        ],
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
    async markAsRead(notification) {
      if (notification.content.link) {
        this.loadingKey++
        await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/mark-as-read.gql'),
          variables: {
            input: { message_id: notification.id }
          }
        })
        this.loadingKey--
      }
    },
    routeToNotifications() {
      this.$router.push({
        name: 'notifications'
      })
    },
    onIntersect([entry]) {
      this.$apollo.queries.notifications.skip = !entry.isIntersecting
      this.$apollo.queries.notificationsCount.skip = !entry.isIntersecting
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
  <v-card
    v-intersect="{ handler: onIntersect }"
    class="py-2 position-relative d-flex flex-column"
    style="height: 100%;"
    tile
  >
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

      <v-list v-else-if="notificationsCount > 0" class=" card-content">
        <template v-for="(n, i) in notifications">
          <v-list-item
            :key="n.id"
            class="position-relative"
            :class="n.read ? 'o-60 hover-o-100' : ''"
            :disabled="isLoading > 0"
            :to="notificationNavigation(n)"
            :href="n.content.link"
            :target="notificationNavigation(n) ? null : '_blank'"
            exact
            @click="markAsRead(n)"
          >
            <v-icon small class="mr-4 grey--text text--darken-1">
              {{ n.content.icon ? n.content.icon : notificationIcon(n.type) }}
            </v-icon>

            <component
              :is="notificationComponent(n.type)"
              :timestamp="formatDateTime(n.created)"
              dense
              :content="n.content"
              :read="n.read"
            />

            <v-list-item-avatar v-if="notificationNavigation(n)">
              <v-icon>arrow_right</v-icon>
            </v-list-item-avatar>
          </v-list-item>
          <v-divider :key="i" class="my-1 mx-4 grey lighten-4" />
        </template>
      </v-list>

      <v-list v-else>
        <v-list-item>
          <v-list-item-avatar class="mr-0">
            <v-icon class="green--text">check</v-icon>
          </v-list-item-avatar>

          <v-list-item-content class="my-0 py-3">
            <div
              class="text-subtitle-1 font-weight-light"
              style="line-height: 1.25rem;"
            >
              You're all caught up!
            </div>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-spacer />

    <v-card-actions class="py-0">
      <v-spacer />
      <v-btn small color="primary" text :to="'/notifications'">
        View all notifications
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.card-content {
  height: 100%;
  max-height: 210px;
  overflow-y: auto;
}
</style>
