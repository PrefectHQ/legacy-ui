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
        { text: 'Current', value: 'View' },
        { text: 'Leave', value: 'Leave' }
      ],
      user: null
    }
  },
  computed: {
    ...mapGetters('user', ['firstName', 'lastName', 'timezone']),
    ...mapGetters('tenant', ['tenant', 'tenants', 'tenantIsSet']),
    role() {
      console.log(this.tenant)
      if (!this.tenant) return

      let role
      switch (this.tenant.role) {
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
    }
  },
  methods: {
    ...mapMutations('user', ['setUserSettings']),
    ...mapActions('user', ['getUser']),
    ...mapActions('tenant', ['setCurrentTenant']),
    async handleSwitchTenant(tenant) {
      this.loading = true

      if (tenant.slug == this.tenant.slug) return

      await this.setCurrentTenant(tenant.slug)

      this.loading = false
      this.tenantMenuOpen = false

      clearCache()
      this.handlePostTokenRouting()
    }
  }
}
</script>

<template>
  <ManagementLayout class="mt-3">
    <template #title>Your Teams</template>

    <template #subtitle>
      See your Prefect teams and roles, switch between them, and leave teams
      {{ role }}
    </template>

    <v-data-table :headers="headers" :items="tenants"></v-data-table>
  </ManagementLayout>
</template>
