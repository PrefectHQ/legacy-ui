<script>
import { mapGetters, mapActions } from 'vuex'
import ManagementLayout from '@/layouts/ManagementLayout'
import { teamProfileMixin } from '@/mixins/teamProfileMixin.js'
import Profile from '@/pages/TeamSettings/Account/Profile'
import LegacyLicense from '@/pages/TeamSettings/Account/LegacyLicense'
import License from '@/pages/TeamSettings/Account/License'
import Users from '@/pages/TeamSettings/Account/Users'
import Billing from '@/pages/TeamSettings/Account/Billing'
import ClearDataDialog from '@/pages/TeamSettings/Account/ClearDataDialog'
import Usage from '@/pages/TeamSettings/Account/Usage/Usage'
import UsageTimeline from '@/pages/TeamSettings/Account/Usage/UsageTimeline'

export default {
  components: {
    ManagementLayout,
    Profile,
    Users,
    ClearDataDialog,
    LegacyLicense,
    License,
    Billing,
    Usage,
    UsageTimeline
  },
  mixins: [teamProfileMixin],
  data() {
    return {
      //profile
      changeProfile: false,
      // Clear data
      clearDataDialog: false
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('license', ['license']),
    needAlert() {
      return !location.href.includes('prefect.io')
    },
    isTenantAdmin() {
      return this.tenant.role === 'TENANT_ADMIN'
    },
    isUsageBased() {
      return this.license?.terms?.is_usage_based
    }
  },
  watch: {},
  methods: {
    ...mapActions('license', ['getLicense'])
  }
}
</script>

<template>
  <div>
    <ManagementLayout>
      <!-- <template v-if="needAlert && isCloud" #alert>
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
    </template> -->

      <v-row no-gutters>
        <v-col cols="12">
          <UsageTimeline />
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col cols="12" md="6"> </v-col>
        <v-col cols="12" md="6">
          <Usage v-if="isCloud && isUsageBased" />
        </v-col>
      </v-row>

      <Profile />
      <LegacyLicense v-if="isCloud && !isUsageBased" />
      <License v-if="isCloud && isUsageBased" />
      <Users v-if="isCloud && !isUsageBased" />
      <Billing v-if="isCloud" />
      <ClearDataDialog v-if="isCloud" />
    </ManagementLayout>
  </div>
</template>

<style lang="scss" scoped>
.v-sheet.v-alert:not(.v-sheet--outlined) {
  padding-left: 25px;
}
</style>
