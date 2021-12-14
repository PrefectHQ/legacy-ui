<script>
import { mapGetters } from 'vuex'
import moment from 'moment-timezone'
import FlowRunNotification from '@/pages/Notifications/NotificationTypes/FlowRun-Notification'
import MembershipNotification from '@/pages/Notifications/NotificationTypes/Membership-Notification'
import ApprovalNotification from '@/pages/Notifications/NotificationTypes/Approval-Notification'
import WhatsNewNotification from '@/pages/Notifications/NotificationTypes/WhatsNew-Notification'
import MessageNotification from '@/pages/Notifications/NotificationTypes/Message-Notification'

import {
  componentMap,
  iconMap,
  iconColorMap,
  navigationMap
} from '@/pages/Notifications/utils'

export default {
  components: {
    ApprovalNotification,
    FlowRunNotification,
    MembershipNotification,
    MessageNotification,
    WhatsNewNotification
  },
  props: {
    read: {
      type: [Boolean, Number],
      required: true
    },
    tenant: {
      type: Object,
      required: false,
      default: () => {
        return { id: null, name: 'Your notifications' }
      }
    },
    updateKey: {
      type: Number,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      limit: 15,
      loading: 0,
      page: 1,
      selected: []
    }
  },
  computed: {
    ...mapGetters('user', ['timezone']),
    ...mapGetters('api', ['isCloud']),
    _allSelected() {
      let selectedIds = this.selected.map(s => s.sid)
      return this.notifications?.every(n => selectedIds.includes(n.id))
    },
    _noneSelected() {
      return this.selected.length === 0
    },
    _someSelected() {
      return (
        this.selected.length > 0 &&
        this.selected.length < this.notifications?.length
      )
    },
    _selected() {
      if (this._allSelected) return 'all'
      if (this._someSelected) return 'some'
      return 'none'
    },
    pages() {
      return Math.ceil(this.notificationsCount / this.limit)
    },
    where() {
      let where = {
        tenant_id: { _eq: this.tenant?.id }
      }

      if (this.tenant.id === 'user-notifications') {
        where.tenant_id = {
          _is_null: true
        }
      }

      if (this.read !== 0) {
        where.read = { _eq: this.read }
      }
      return where
    }
  },
  watch: {
    loading(current, previous) {
      this.$emit('loading', current - previous)
    },
    notificationsCount(val) {
      this.$emit('count', { id: this.tenant.id, count: val })
    },
    page() {
      this.$emit('remove', [...this.selected])
      this.selected = []
    },
    updateKey() {
      this.page = 1
      this.selected = []
      this.$apollo.queries.notifications.refetch()
      this.$apollo.queries.notificationsCount.refetch()
    }
  },
  methods: {
    active(sid) {
      return this.selected.findIndex(s => s.sid === sid) > -1
    },
    formatDateTime(timestamp) {
      if (!timestamp) throw new Error('Did not recieve a timestamp')

      let t = moment(timestamp).tz(this.timezone),
        shortenedTz = moment()
          .tz(this.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
          .zoneAbbr()

      let timeObj = t ? t : moment(timestamp)

      let formatted = timeObj.calendar(null, {
        sameDay: 'h:mma',
        sameElse: 'MMMM D, YYYY [at] h:mma'
      })
      return `${formatted} ${shortenedTz}`
    },
    handleSelectAll() {
      if (this._allSelected) {
        this.$emit('remove', [...this.selected])
        this.selected = []
      } else {
        this.selected = this.notifications.map(n => {
          let obj = {}
          obj.sid = n.id
          obj.read = n.read
          return obj
        })
        this.$emit('add', [...this.selected])
      }
    },
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
    async selectAllNoLimit() {
      this.loading++
      const { data } = await this.$apollo.query({
        query: require('@/graphql/Notifications/all-notifications.gql'),
        variables: {
          where: this.where
        }
      })
      this.selected = data.notifications.map(n => {
        let obj = {}
        obj.sid = n.id
        obj.read = n.read
        return obj
      })
      this.$emit('add', [...this.selected])

      this.loading--
    },
    updateSelected(sid, read) {
      let j = this.selected.findIndex(s => s.sid === sid)
      if (j > -1) {
        let obj = this.selected[j]
        this.selected.splice(j, 1)
        this.$emit('remove', [obj])
      } else {
        let obj = {}
        obj.sid = sid
        obj.read = read
        this.selected.push(obj)
        this.$emit('add', [obj])
      }
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
  <v-card v-show="notificationsCount > 0" class="mb-4 py-2 px-4" tile>
    <v-card-title class="pl-1 text-subtitle-2 grey--text text--darken-2">
      {{ tenant.name }}
    </v-card-title>

    <v-divider />

    <div class="d-flex align-center justify-start mt-6 mb-2">
      <v-checkbox
        v-if="notifications && notifications.length > 0"
        class="ml-4 py-0 my-0"
        hide-details
        :disabled="loading > 0"
        :label="
          selected.length === 0 ? 'Select all' : `${selected.length} Selected`
        "
        :input-value="_selected"
        true-value="all"
        false-value="none"
        :indeterminate="_someSelected"
        @click.stop="handleSelectAll"
      />

      <v-btn
        v-if="pages > 1"
        class="ml-4"
        small
        depressed
        text
        @click="selectAllNoLimit"
      >
        Select all {{ notificationsCount }} notifications
      </v-btn>
    </div>

    <v-card-text class="pt-0">
      <v-list data-cy="notifications-list">
        <template v-for="(n, i) in notifications">
          <v-list-item
            :key="n.id"
            class="px-0 position-relative"
            :class="n.read ? 'o-60 hover-o-100' : ''"
            :disabled="loading > 0"
            :to="notificationNavigation(n)"
            exact
          >
            <v-icon
              v-if="!n.read"
              class="notification-badge"
              color="codePink"
              x-small
            >
              fiber_manual_record
            </v-icon>

            <v-list-item-action
              class="cursor-pointer mr-0 my-0 o-100"
              style="height: 58px;"
              @click.prevent="updateSelected(n.id, n.read)"
              @mousedown.stop
            >
              <v-icon :color="active(n.id) ? 'primary' : 'grey'">
                {{ active(n.id) ? 'check_box' : 'check_box_outline_blank' }}
              </v-icon>
            </v-list-item-action>

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

      <v-pagination
        v-if="
          notifications &&
            notifications.length > 0 &&
            notificationsCount > limit
        "
        v-model="page"
        :length="pages"
        class="mt-4"
        total-visible="6"
      />
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.notification-badge {
  left: -20px;
  position: absolute;
}
</style>
