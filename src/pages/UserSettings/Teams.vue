<script>
import { mapActions, mapGetters } from 'vuex'
import { clearCache } from '@/vue-apollo'
import { handleMembershipInvitations } from '@/mixins/membershipInvitationMixin'

import ManagementLayout from '@/layouts/ManagementLayout.vue'
import ConfirmDialog from '@/components/ConfirmDialog'

export default {
  components: {
    ManagementLayout,
    ConfirmDialog
  },
  mixins: [handleMembershipInvitations],
  data() {
    return {
      dialogRemoveUser: false,
      handlingInvitationLoad: false,
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'URL', value: 'slug' },
        { text: 'Role', value: 'role' },
        { text: '', value: 'id', align: 'right', sortable: false }
      ],
      isRemovingUser: false,
      removeTenant: null
    }
  },
  computed: {
    ...mapGetters('user', ['memberships', 'user']),
    ...mapGetters('tenant', ['tenant', 'tenants'])
  },
  methods: {
    ...mapActions('tenant', ['getTenants', 'setCurrentTenant']),
    ...mapActions('user', ['getUser']),
    currentMemberships() {
      return this.memberships.map(i => i.tenant.id)
    },
    role(item) {
      let role
      switch (item) {
        case 'USER':
          role = 'User'
          break
        case 'READ_ONLY_USER':
          role = 'Restricted User'
          break
        case 'TENANT_ADMIN':
          role = 'Administrator'
          break
        default:
          role = ''
          break
      }
      return role
    },
    async handleAcceptPendingInvitation(id) {
      this.handlingInvitationLoad = true
      const inviteId = this.pendingInvitations.find(i => i.tenant.id == id)?.id
      try {
        await this.acceptMembershipInvitation(inviteId)
      } catch (e) {
        console.log(e)
      } finally {
        await this.$apollo.queries.pendingInvitations.refetch()
        this.handlingInvitationLoad = false
      }
      await this.getUser()
      await this.getTenants()
    },
    async handleDeclinePendingInvitation(id) {
      this.handlingInvitationLoad = true
      const inviteId = this.pendingInvitations.find(i => i.tenant.id == id)?.id
      try {
        await this.declineMembershipInvitation(inviteId)
      } catch (e) {
        console.log(e)
      } finally {
        await this.$apollo.queries.pendingInvitations.refetch()
        this.handlingInvitationLoad = false
      }
      await this.getUser()
      await this.getTenants()
    },
    async removeUser(removalTenant) {
      this.isRemovingUser = true
      const initialTenant = this.tenant

      const membershipId = this.memberships.find(
        m => m.tenant.id == removalTenant.id
      )?.id

      if (initialTenant.id !== removalTenant.id) {
        await this.setCurrentTenant(removalTenant.slug)
      }

      const res = await this.$apollo.mutate({
        mutation: require('@/graphql/Tenant/delete-membership.gql'),
        variables: { membershipId }
      })

      if (res?.data?.delete_membership?.success) {
        this.$emit(
          'successful-action',
          'You have removed yourself from this team.'
        )
      } else {
        this.$emit(
          'failed-action',
          'Something went wrong while trying to leave this team. Please try again.'
        )
      }

      if (initialTenant.id !== removalTenant.id) {
        await this.setCurrentTenant(initialTenant.slug)
      } else if (this.tenants[0].id === removalTenant.id) {
        await this.setCurrentTenant(this.tenants[1].slug)
      } else {
        await this.setCurrentTenant(this.tenants[0].slug)
      }

      await this.getTenants()

      this.isRemovingUser = false
      this.dialogRemoveUser = false
    },
    async handleSwitchTenant(tenant) {
      this.loading = true

      if (tenant.slug == this.tenant.slug) return

      await this.setCurrentTenant(tenant.slug)

      this.loading = false

      clearCache()
      this.$router.push({
        name: 'dashboard',
        params: { tenant: this.tenant.slug }
      })
    }
  },
  apollo: {
    pendingInvitations: {
      query: require('@/graphql/Tenant/pending-invitations-by-email.gql'),
      variables() {
        return {
          email: this.user.email
        }
      },
      async result({ data, loading }) {
        if (loading || !data || !data.pendingInvitations) return
        // We filter this because we don't want to show invitations
        // to tenants we're already in...
        // This is due to a bug(feature?) in the back end that allows
        // users to be invited to tenants they're already part of
        await this.getUser()
        this.pendingInvitations =
          data.pendingInvitations && data.pendingInvitations.length
            ? data.pendingInvitations.filter(
                pi =>
                  !this.memberships
                    .map(at => at.tenant.id)
                    .includes(pi.tenant.id)
              )
            : []
      },
      fetchPolicy: 'network-only',
      pollInterval: 60000
    }
  }
}
</script>

<template>
  <ManagementLayout>
    <template #title>Your Teams</template>

    <template #subtitle>
      View and manage your team memberships
    </template>

    <v-data-table
      fixed-header
      class="elevation-2 rounded-none truncate-table"
      :headers="headers"
      :header-props="{ 'sort-icon': 'arrow_drop_up' }"
      :items="tenants"
      :footer-props="{
        showFirstLastPage: true,
        firstIcon: 'first_page',
        lastIcon: 'last_page',
        prevIcon: 'keyboard_arrow_left',
        nextIcon: 'keyboard_arrow_right'
      }"
    >
      <template #header.name="{ header }">
        <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
      </template>
      <template #header.slug="{ header }">
        <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
      </template>
      <template #header.role="{ header }">
        <span class="subtitle-2">{{ header.text.toUpperCase() }}</span>
      </template>
      <template #item.role="{item}">
        {{ role(item.role) }}
      </template>
      <template #item.id="{item}">
        <v-tooltip bottom>
          <template #activator="{on}">
            <v-btn
              v-if="!currentMemberships().includes(item.id)"
              text
              fab
              x-small
              color="primary"
              v-on="on"
              @click="handleAcceptPendingInvitation(item.id)"
              ><v-icon>check</v-icon></v-btn
            ></template
          >Accept invite to join team
        </v-tooltip>
        <v-tooltip bottom>
          <template #activator="{on}">
            <v-btn
              v-if="!currentMemberships().includes(item.id)"
              text
              fab
              x-small
              color="error"
              v-on="on"
              @click="handleDeclinePendingInvitation(item.id)"
              ><v-icon>close</v-icon></v-btn
            ></template
          >Decline invite to join team
        </v-tooltip>
        <v-tooltip bottom
          ><template #activator="{on}"
            ><v-btn
              v-if="
                item.id !== tenant.id && currentMemberships().includes(item.id)
              "
              text
              fab
              x-small
              color="primary"
              v-on="on"
              @click="handleSwitchTenant(item)"
              ><v-icon>fas fa-eye</v-icon></v-btn
            ></template
          >Switch to this team</v-tooltip
        >
        <v-tooltip bottom
          ><template #activator="{on}"
            ><v-btn
              v-if="currentMemberships().includes(item.id)"
              text
              fab
              x-small
              color="error"
              v-on="on"
              @click="
                dialogRemoveUser = true
                removeTenant = item
              "
              ><v-icon>close</v-icon></v-btn
            ></template
          >Leave this team</v-tooltip
        >
        <ConfirmDialog
          v-if="removeTenant"
          v-model="dialogRemoveUser"
          type="error"
          :title="
            `Are you sure you want to remove yourself from ${removeTenant.name}?`
          "
          :dialog-props="{ 'max-width': '600' }"
          :disabled="isRemovingUser"
          :loading="isRemovingUser"
          @confirm="removeUser(removeTenant)"
        >
          <div class="red--text"
            >Are you sure you want to remove yourself from
            {{ removeTenant.name }}? You'll no longer be able to access your run
            data associated with {{ removeTenant.name }}.
          </div>
        </ConfirmDialog>
      </template>
    </v-data-table>
  </ManagementLayout>
</template>
