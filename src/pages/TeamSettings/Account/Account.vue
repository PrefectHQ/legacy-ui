<script>
import { mapGetters, mapActions } from 'vuex'
import ManagementLayout from '@/layouts/ManagementLayout'
import { teamProfileMixin } from '@/mixins/teamProfileMixin.js'
import Profile from '@/pages/TeamSettings/Account/Profile'
import License from '@/pages/TeamSettings/Account/License'
import Users from '@/pages/TeamSettings/Account/Users'
import Billing from '@/pages/TeamSettings/Account/Billing'
import ClearDataDialog from '@/pages/TeamSettings/Account/ClearDataDialog'

export default {
  components: {
    ManagementLayout,
    Profile,
    Users,
    ClearDataDialog,
    License,
    Billing
  },
  mixins: [teamProfileMixin],
  data() {
    return {
      //profile
      changeProfile: false,
      // Clear data
      clearDataDialog: false
      //Billing
    }
  },
  computed: {
    ...mapGetters('auth0', ['authorizationToken']),
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('license', ['license']),
    isMobile() {
      return this.$vuetify.breakpoint.xsOnly
    },
    isTenantAdmin() {
      return this.tenant.role === 'TENANT_ADMIN'
    }
  },
  watch: {},
  mounted() {},
  methods: {
    ...mapActions('license', ['getLicense'])
  }
}
</script>

<template>
  <ManagementLayout>
    <template v-slot:title>Account</template>

    <template v-slot:subtitle>
      Manage your team's billing, data, and profile information.
    </template>

    <Profile />
    <License />
    <Users />
    <Billing />
    <ClearDataDialog />
  </ManagementLayout>
</template>
