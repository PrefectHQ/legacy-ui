<script>
import { mapActions, mapGetters, mapMutations } from 'vuex'
import { clearCache } from '@/vue-apollo'

import ManagementLayout from '@/layouts/ManagementLayout.vue'

export default {
  components: {
    ManagementLayout
  },
  data() {
    return {
      headers: [
        { text: 'Name', value: 'name' },
        { text: 'URL', value: 'slug' },
        { text: 'Role', value: 'role' },
        { text: 'Actions', value: 'id' }
      ],
      user: null
    }
  },
  computed: {
    ...mapGetters('user', ['memberships']),
    ...mapGetters('tenant', ['tenant', 'tenants', 'tenantIsSet'])
  },
  methods: {
    ...mapMutations('user', ['setUserSettings']),
    ...mapActions('user', ['getUser']),
    ...mapActions('tenant', ['setCurrentTenant']),
    role(item) {
      console.log('tenants', this.tenants)
      console.log('memberships', this.memberships)
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
        {{ item.id === tenant.id ? 'Current' :
        <button @click="handleSwitchTenant(item)">View</button> }}
        <button @click="removeUser(item)">Leave</button>
      </template>
    </v-data-table>
  </ManagementLayout>
</template>
