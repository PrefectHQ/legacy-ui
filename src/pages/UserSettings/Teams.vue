<script>
import { mapActions, mapGetters } from 'vuex'
import { clearCache } from '@/vue-apollo'
import { handleMembershipInvitations } from '@/mixins/membershipInvitationMixin'
import AcceptConfirmInputRow from '@/components/AcceptConfirmInputRow'

import ManagementLayout from '@/layouts/ManagementLayout.vue'
import ConfirmDialog from '@/components/ConfirmDialog'

export default {
  components: {
    ManagementLayout,
    ConfirmDialog,
    AcceptConfirmInputRow
  },
  mixins: [handleMembershipInvitations],
  data() {
    return {
      dialogRemoveUser: false,
      handlingInvitationLoad: false,
      headers: [
        { text: 'Name', value: 'tenant.name', width: '35%' },
        { text: 'URL', value: 'tenant.slug', width: '35%' },
        { text: '', value: 'id', align: 'right', sortable: false, width: '30%' }
      ],
      isRemovingUser: false,
      pendingInvitations: [],
      removeTenant: null,
      confirmInput: null,
      rules: {
        confirm: value => value == this.tenant.slug || 'Input is incorrect.',
        required: value => !!value || 'This field is is required.'
      }
    }
  },
  computed: {
    ...mapGetters('user', ['memberships', 'user']),
    ...mapGetters('tenant', ['tenant', 'tenants']),
    items() {
      return [
        ...this.memberships.map(m => {
          return {
            ...m,
            member: true
          }
        }),
        ...this.pendingInvitations
      ]
    },
    isLastTenant() {
      return this.tenants?.length === 1
    }
  },
  methods: {
    ...mapActions('tenant', ['getTenants', 'setCurrentTenant']),
    ...mapActions('user', ['getUser']),
    ...mapActions('alert', ['setAlert']),
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
    async handleAcceptPendingInvitation(id, name, slug) {
      this.handlingInvitationLoad = true
      let success
      try {
        await this.acceptMembershipInvitation(id)
        success = true
      } catch (e) {
        success = false
      } finally {
        this.setAlert(
          {
            alertShow: true,
            alertMessage: success
              ? `You joined ${name}... hurrah!`
              : `Something went wrong trying to accept your invitation to ${name}... please wait a few moments and try again.`,
            alertType: success ? 'success' : 'error',
            alertLink: success
              ? {
                  name: 'dashboard',
                  params: { tenant: slug }
                }
              : null,
            linkText: success ? 'Take me to my new tenant!' : ''
          },
          3000
        )
        await this.$apollo.queries.pendingInvitations.refetch()
        await this.getUser()
        await this.getTenants()
        this.handlingInvitationLoad = false
      }
    },
    async handleDeclinePendingInvitation(id, name) {
      this.handlingInvitationLoad = true
      let success
      try {
        await this.declineMembershipInvitation(id)
        success = true
      } catch (e) {
        success = false
      } finally {
        this.setAlert(
          {
            alertShow: true,
            alertMessage: success
              ? `Invitation to join ${name} declined.`
              : `Something went wrong trying to decline your invitation to ${name}... please wait a few moments and try again.`,
            alertType: success ? 'success' : 'error'
          },
          3000
        )
        await this.$apollo.queries.pendingInvitations.refetch()
        await this.getUser()
        await this.getTenants()
        this.handlingInvitationLoad = false
      }
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

      let success

      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/Tenant/delete-membership.gql'),
          variables: { membershipId }
        })
        success = true
      } catch (e) {
        success = false
      } finally {
        this.setAlert(
          {
            alertShow: true,
            alertMessage: success
              ? 'You have removed yourself from this team.'
              : 'Something went wrong while trying to leave this team. Please try again.',
            alertType: success ? 'success' : 'error'
          },
          3000
        )
      }

      if (initialTenant.id !== removalTenant.id) {
        await this.setCurrentTenant(initialTenant.slug)
      } else if (this.tenants[0].id === removalTenant.id) {
        await this.setCurrentTenant(this.tenants[1].slug)
      } else {
        await this.setCurrentTenant(this.tenants[0].slug)
      }

      await this.getUser()
      await this.getTenants()

      this.resetRemoveUserDialog()
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
    },
    resetRemoveUserDialog() {
      this.dialogRemoveUser = false
      this.isRemovingUser = false
      this.confirmInput = null
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
      fetchPolicy: 'network-only',
      pollInterval: 60000,
      update: data => data?.pendingInvitations ?? []
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
      class="elevation-2 rounded-0 truncate-table"
      :headers="headers"
      :header-props="{ 'sort-icon': 'arrow_drop_up' }"
      :items="items"
      :footer-props="{
        showFirstLastPage: true,
        firstIcon: 'first_page',
        lastIcon: 'last_page',
        prevIcon: 'keyboard_arrow_left',
        nextIcon: 'keyboard_arrow_right'
      }"
    >
      <template #header.name="{ header }">
        <span class="text-subtitle-2">{{ header.text.toUpperCase() }}</span>
      </template>
      <template #header.slug="{ header }">
        <span class="text-subtitle-2">{{ header.text.toUpperCase() }}</span>
      </template>
      <template #header.role="{ header }">
        <span class="text-subtitle-2">{{ header.text.toUpperCase() }}</span>
      </template>

      <template #item.id="{item}">
        <AcceptConfirmInputRow
          v-if="!item.member"
          :loading="handlingInvitationLoad"
          :tooltips="true"
          @accept="
            handleAcceptPendingInvitation(
              item.id,
              item.tenant.name,
              item.tenant.slug
            )
          "
          @decline="handleDeclinePendingInvitation(item.id, item.tenant.name)"
        />
        <div style="padding-right: 6px;">
          <v-tooltip bottom
            ><template #activator="{on}"
              ><v-btn
                v-if="item.tenant.id !== tenant.id && item.member"
                text
                small
                style="margin-right: 14px;"
                color="primary"
                v-on="on"
                @click="handleSwitchTenant(item.tenant)"
                ><v-icon>swap_horiz</v-icon></v-btn
              ></template
            >Switch to this team</v-tooltip
          >
          <v-tooltip bottom
            ><template #activator="{on}"
              ><v-btn
                v-if="item.member"
                text
                small
                color="error"
                v-on="on"
                @click="
                  dialogRemoveUser = true
                  removeTenant = item.tenant
                "
                ><v-icon>close</v-icon></v-btn
              ></template
            >Leave this team</v-tooltip
          >
        </div>
        <ConfirmDialog
          v-if="removeTenant"
          v-model="dialogRemoveUser"
          type="error"
          :title="
            `Are you sure you want to remove yourself from ${removeTenant.name}?`
          "
          :dialog-props="{ 'max-width': '600' }"
          :disabled="
            (isLastTenant && confirmInput !== tenant.slug) || isRemovingUser
          "
          :loading="isRemovingUser"
          @confirm="removeUser(removeTenant)"
          @cancel="resetRemoveUserDialog"
        >
          <div>
            <div class="red--text mb-2"
              >You'll no longer be able to access your run data associated with
              {{ removeTenant.name }}.</div
            >
            <div v-show="isLastTenant" class="mt-2">
              <div class="deepRed--text text-subtitle-1 font-weight-medium">
                This is the last team you are part of. If you remove it you will
                not be able to log back in to Prefect Cloud.
              </div>

              <div class="mt-4">
                To confirm, type
                <span class="font-weight-bold"> your tenant URL slug </span>
                below:
              </div>

              <v-text-field
                v-model="confirmInput"
                autocomplete="off"
                class="my-1"
                placeholder="Type your tenant URL slug"
                single-line
                outlined
                color="primary"
                :rules="[rules.required, rules.confirm]"
                :loading="isRemovingUser"
              >
              </v-text-field>
            </div>
          </div>
        </ConfirmDialog>
      </template>
    </v-data-table>
  </ManagementLayout>
</template>
