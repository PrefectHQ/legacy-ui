<script>
import { mapGetters } from 'vuex'
import BreadCrumbs from '@/components/BreadCrumbs'
import NotificationGroup from '@/pages/Notifications/NotificationGroup'
import NotificationsLayout from '@/layouts/NotificationsLayout'
import SubPageNav from '@/layouts/SubPageNav'
import gql from 'graphql-tag'
import LogRocket from 'logrocket'

export default {
  components: {
    BreadCrumbs,
    NotificationGroup,
    NotificationsLayout,
    SubPageNav
  },
  filters: {},
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
  data() {
    return {
      allCaughtUp: false,
      counts: [],
      loading: 0,
      notificationFilters: { team: undefined },
      notifications: [],
      read: false,
      selected: [],
      updateKey: 0
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    _allSelected() {
      return this.selected.length === this.notifications?.length
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
    _allRead() {
      return (
        this.selected.map(i => i.read).every(t => t === true) &&
        this.selected.length > 0
      )
    },
    _selected() {
      if (this._allSelected) return 'all'
      if (this._someSelected) return 'some'
      return 'none'
    },
    count() {
      return this.counts.reduce((a, b) => a + b.count, 0)
    },
    filteredTeams() {
      if (
        this.notificationFilters.team &&
        this.notificationFilters.team !== null
      ) {
        return this.teams.filter(
          team => team.id == this.notificationFilters.team
        )
      }
      return this.teams
    },
    hideOnMobile() {
      return { 'tabs-hidden': this.$vuetify.breakpoint.smAndDown }
    },
    showAllCaughtUp() {
      let count = this.counts.find(c => c.id === this.notificationFilters.team)
      return this.allCaughtUp || count?.count === 0
    },
    where() {
      let where = {}

      if (this.read !== 0) {
        where.read = { _eq: this.read }
      }
      return where
    }
  },
  watch: {
    read() {
      this.selected = []
      this.updateKey++
    },
    teams(val) {
      if (!val) return

      this.counts = val.map(v => {
        return {
          id: v.id,
          count: 0
        }
      })

      // This pushes the user notifications count object
      this.counts.push({
        id: 'user-notifications',
        count: 0
      })
    }
  },
  methods: {
    _handleAdd(arr) {
      this.selected = [...new Set([...this.selected, ...arr])]
    },
    _handleRemove(arr) {
      this.selected = this.selected.filter(i => !arr.includes(i))
    },
    getCount(id) {
      return this.counts.find(c => c.id == id)?.count
    },
    handleSelect() {
      if (this._allSelected) {
        this.selected = []
      } else {
        this.selected = this.notifications.map((n, i) => i)
      }
    },
    async deleteMessages() {
      if (this.selected?.length === 0) return

      this.loading++

      let messageMutations = ''

      let selectedIds = this.selected.map(s => s.sid)

      selectedIds.forEach((sid, i) => {
        messageMutations += `
          d${i}: delete_message(input: { message_id: "${sid}" }) {
              success
              error
            }
        `
      })

      try {
        let mutationString = gql`
              mutation DeleteMessages {
                ${messageMutations}
              }
            `

        const { data } = await this.$apollo.mutate({
          mutation: mutationString
        })

        if (data?.d0.success) {
          this.selected = []
        }
      } catch (e) {
        LogRocket.error(e, {
          extra: {
            pageName: 'Notifications',
            stage: 'Deleting notifications'
          }
        })
      }

      this.loading--
      this.updateKey++
    },
    async markAsRead() {
      if (this.selected?.length === 0) return

      this.loading++

      let messageMutations = ''

      let selectedIds = this.selected.map(s => s.sid)

      selectedIds.forEach((sid, i) => {
        messageMutations += `
          m${i}: mark_message_as_read(input: { message_id: "${sid}" }) {
              success
              error
            }
        `
      })

      try {
        let mutationString = gql`
              mutation MarkMessagesAsRead {
                ${messageMutations}
              }
            `

        const { data } = await this.$apollo.mutate({
          mutation: mutationString
        })

        if (data?.m0.success) {
          this.selected = []
        }
      } catch (e) {
        LogRocket.error(e, {
          extra: {
            pageName: 'Notifications',
            stage: 'Marking notifications as read'
          }
        })
      }

      this.loading--
      this.updateKey++
    },
    async markAsUnread() {
      if (this.selected?.length === 0) return

      this.loading++

      let messageMutations = ''

      let selectedIds = this.selected.map(s => s.sid)

      selectedIds.forEach((sid, i) => {
        messageMutations += `
          m${i}: mark_message_as_unread(input: { message_id: "${sid}" }) {
              success
              error
            }
        `
      })

      try {
        let mutationString = gql`
              mutation MarkMessagesAsUnread {
                ${messageMutations}
              }
            `

        const { data } = await this.$apollo.mutate({
          mutation: mutationString
        })

        if (data?.m0.success) {
          this.selected = []
        }
      } catch (e) {
        LogRocket.error(e, {
          extra: {
            pageName: 'Notifications',
            stage: 'Marking notifications as unread'
          }
        })
      }

      this.loading--
      this.updateKey++
    },
    updateCount(data) {
      let i = this.counts.findIndex(c => c.id === data.id)
      this.counts[i].count = data.count
      this.allCaughtUp = this.count === 0
    },
    updateLoading(val) {
      this.loading += val
    }
  },
  apollo: {
    teams: {
      query: require('@/graphql/Notifications/teams.gql'),
      loadingKey: 'loading',
      update: data => data.teams
    }
  }
}
</script>

<template>
  <v-sheet color="appBackground">
    <SubPageNav>
      <span slot="page-type">Notifications</span>
      <span
        slot="page-title"
        style="height: 28px;
        overflow: hidden;"
      >
        <BreadCrumbs
          slot="breadcrumbs"
          :crumbs="[
            {
              route: { name: 'dashboard', params: { tenant: tenant.slug } },
              text: 'Dashboard'
            }
          ]"
        ></BreadCrumbs>
      </span>
    </SubPageNav>

    <NotificationsLayout>
      <v-card slot="col-1" class="py-2 px-4 text-left" tile>
        <v-progress-linear
          :active="loading > 0"
          indeterminate=""
          color="primary"
          background-opacity="0"
          absolute
          :bottom="$vuetify.breakpoint.xs"
        />

        <v-btn-toggle
          v-model="read"
          :class="
            $vuetify.breakpoint.mdAndDown && !$vuetify.breakpoint.xs
              ? 'd-flex flex-column stacking-btn-toggle'
              : 'mr-4 my-2'
          "
          dense
          mandatory
        >
          <v-btn
            :small="$vuetify.breakpoint.xs"
            :value="null"
            :disabled="loading > 0"
          >
            All
          </v-btn>

          <v-btn
            :small="$vuetify.breakpoint.xs"
            :value="false"
            :disabled="loading > 0"
          >
            <v-icon left color="codePink" x-small>fiber_manual_record</v-icon>
            Unread
          </v-btn>

          <v-btn
            :small="$vuetify.breakpoint.xs"
            :value="true"
            :disabled="loading > 0"
          >
            <v-icon left color="grey lighten-1" x-small>
              fiber_manual_record
            </v-icon>
            Read
          </v-btn>
        </v-btn-toggle>

        <v-btn
          v-if="!read && _allRead === false"
          :small="$vuetify.breakpoint.xs"
          depressed
          :disabled="loading > 0 || selected.length === 0"
          color="primary"
          :block="!$vuetify.breakpoint.xs"
          :class="$vuetify.breakpoint.xs ? 'mr-4 my-2' : 'my-4'"
          @click="markAsRead"
        >
          <v-icon left color="grey lighten-1" small>
            fiber_manual_record
          </v-icon>
          Mark as Read
        </v-btn>

        <v-btn
          v-else
          :small="$vuetify.breakpoint.xs"
          depressed
          :disabled="loading > 0 || selected.length === 0"
          color="primary"
          :block="!$vuetify.breakpoint.xs"
          :class="$vuetify.breakpoint.xs ? 'mr-4 my-2' : 'my-4'"
          @click="markAsUnread"
        >
          <v-icon left color="grey lighten-1" small>
            fiber_manual_record
          </v-icon>
          Mark as Unread
        </v-btn>

        <v-btn
          :small="$vuetify.breakpoint.xs"
          depressed
          :disabled="loading > 0 || selected.length === 0"
          color="primary"
          :block="!$vuetify.breakpoint.xs"
          :class="$vuetify.breakpoint.xs ? 'mr-4 my-2' : 'my-4'"
          @click="deleteMessages"
        >
          <v-icon left small>
            delete
          </v-icon>

          Delete Selected
        </v-btn>

        <v-divider />

        <v-card-title class="ml-4 pl-0 subtitle-2 grey--text text--darken-2">
          Filter
        </v-card-title>
        <v-list-item-group v-model="notificationFilters.team" color="primary">
          <v-list-item selectable value="user-notifications">
            <v-list-item-content>
              <v-list-item-title>
                Your notifications
                <span
                  v-if="getCount('user-notifications') > 0"
                  class="font-weight-bold ml-1"
                >
                  ({{ getCount('user-notifications') }})
                </span>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            v-for="team in teams"
            :key="team.id"
            selectable
            :value="team.id"
          >
            <v-list-item-content>
              <v-list-item-title>
                {{ team.name }}
                <span
                  v-if="getCount(team.id) > 0"
                  class="font-weight-bold ml-1"
                >
                  ({{ getCount(team.id) }})
                </span>
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-card>

      <transition-group name="bf">
        <div v-show="!allCaughtUp" key="notificationgroup">
          <NotificationGroup
            v-if="
              teams &&
                (notificationFilters.team === undefined ||
                  notificationFilters.team === 'user-notifications')
            "
            :loading="loading"
            :read="read"
            :tenant="{ id: 'user-notifications', name: 'Your notifications' }"
            :update-key="updateKey"
            @add="_handleAdd"
            @count="updateCount"
            @loading="updateLoading"
            @remove="_handleRemove"
          />

          <NotificationGroup
            v-for="team in filteredTeams"
            :key="team.id"
            :loading="loading"
            :read="read"
            :tenant="team"
            :update-key="updateKey"
            @add="_handleAdd"
            @count="updateCount"
            @loading="updateLoading"
            @remove="_handleRemove"
          />
        </div>

        <v-card v-if="showAllCaughtUp" key="allcaughtup" class="py-2 px-4" tile>
          <v-card-text>
            <v-row class="pa-12">
              <v-col
                cols="12"
                class="d-flex justify-center flex-column text-center"
              >
                <img
                  class="photo"
                  src="@/assets/backgrounds/build-a-flow.svg"
                  alt="All Caught Up Image"
                />
                <div class="headline mt-12">
                  You're all caught up!
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </transition-group>
    </NotificationsLayout>
  </v-sheet>
</template>

<style lang="scss">
// stylelint-disable
.bf-enter-active,
.bf-leave-active {
  transition: opacity 0.3s !important;
}

.bf-leave-active {
  display: none;
}

.bf-enter,
.bf-leave-to {
  opacity: 0 !important;
}
// stylelint-enable
</style>
