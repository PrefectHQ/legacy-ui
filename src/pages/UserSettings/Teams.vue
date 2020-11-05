<script>
import { mapActions, mapGetters } from 'vuex'
import { clearCache } from '@/vue-apollo'

import ManagementLayout from '@/layouts/ManagementLayout.vue'
import ConfirmDialog from '@/components/ConfirmDialog'

export default {
  components: {
    ManagementLayout,
    ConfirmDialog
  },
  data() {
    return {
      dialogRemoveUser: false,
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'URL', value: 'slug' },
        { text: 'Role', value: 'role' },
        { text: 'Actions', value: 'id' }
      ],
      isRemovingUser: false,
      removeTenant: null
    }
  },
  computed: {
    ...mapGetters('user', ['memberships']),
    ...mapGetters('tenant', ['tenant', 'tenants'])
  },
  methods: {
    ...mapActions('tenant', ['setCurrentTenant']),
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
    async removeUser(tenant) {
      console.log('in removeUser', tenant)
      console.log('did I set user?', this.memberships)
      this.isRemovingUser = true

      /*const res = await this.$apollo.mutate({
        mutation: require('@/graphql/Tenant/delete-membership.gql'),
        variables: { membershipId }
      })

      if (res?.data?.delete_membership?.success) {
        this.$emit(
          'successful-action',
          'You have removed yourself from this team.'
        )
        this.$apollo.queries.tenantUsers.refetch()
      } else {
        this.$emit(
          'failed-action',
          'Something went wrong while trying to leave this team. Please try again.'
        )
      }
*/
      this.isRemovingUser = false
      this.dialogRemoveUser = false
      this.selectedUser = null
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
  }
}
</script>

<template>
  <ManagementLayout class="mt-3">
    <template #title>Your Teams</template>

    <template #subtitle>
      See your Prefect teams and roles, switch between them, and leave teams
    </template>

    <v-data-table :headers="headers" :items="tenants">
      <template #item.role="{item}">
        {{ role(item.role) }}
      </template>
      <template #item.id="{item}">
        <v-btn v-if="item.id !== tenant.id" @click="handleSwitchTenant(item)"
          >View</v-btn
        >
        <span v-else>Current</span>
        <v-btn
          @click="
            dialogRemoveUser = true
            removeTenant = item
          "
          >Leave</v-btn
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
            {{ removeTenant.name }}? You'll no longer be able to access your
            Projects or Flows associated with {{ removeTenant.name }}.
          </div>
        </ConfirmDialog>
      </template>
    </v-data-table>
  </ManagementLayout>
</template>
