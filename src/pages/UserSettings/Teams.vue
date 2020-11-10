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
        { text: '', value: 'id', align: 'right', sortable: false }
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
    ...mapActions('tenant', ['getTenants', 'setCurrentTenant']),
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
        <v-tooltip bottom
          ><template #activator="{on}"
            ><v-btn
              v-if="item.id !== tenant.id"
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
            {{ removeTenant.name }}? You'll no longer be able to access your
            Projects or Flows associated with {{ removeTenant.name }}.
          </div>
        </ConfirmDialog>
      </template>
    </v-data-table>
  </ManagementLayout>
</template>
