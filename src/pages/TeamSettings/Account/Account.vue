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
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('license', ['license']),
    isMobile() {
      return this.$vuetify.breakpoint.xsOnly
    },
    isTenantAdmin() {
      return this.tenant.role === 'TENANT_ADMIN'
    },
    needAlert() {
      return !location.href.includes('prefect.io')
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
    <template v-if="needAlert && isCloud" #alert>
      <v-alert
        dismissible
        class="mx-auto mb-12"
        border="left"
        colored-border
        elevation="2"
        type="warning"
        tile
        prominent
        ><div>You are connected to Prefect Cloud. </div
        ><div>
          Any changes you make here will affect your Cloud account.</div
        ></v-alert
      >
    </template>
    <template #title>Account</template>

    <template v-if="isCloud" #subtitle>
      Manage your team's billing, data, and profile information.
    </template>
    <template v-else #subtitle>
      Update your team's profile.
    </template>

    <Profile />
    <License v-if="isCloud" />
    <Users v-if="isCloud" />
    <Billing v-if="isCloud" />
    <ClearDataDialog v-if="isCloud" />
  </ManagementLayout>
</template>

<style lang="scss" scoped>
.v-sheet.v-alert:not(.v-sheet--outlined) {
  padding-left: 25px;
}
</style>
