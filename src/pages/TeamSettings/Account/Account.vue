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
// import Usage from '@/pages/TeamSettings/Account/Usage/Usage'
import UsageTimeline from '@/pages/TeamSettings/Account/Usage/UsageTimeline'
import ChartCard from '@/components/ChartCard/ChartCard'

export default {
  components: {
    ChartCard,
    ManagementLayout,
    Profile,
    Users,
    ClearDataDialog,
    LegacyLicense,
    License,
    Billing,
    // Usage,
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
    <div v-if="isCloud && isUsageBased">
      <v-row no-gutters class="my-16">
        <v-col cols="12" md="6">
          <ChartCard
            :chart-data="[
              { label: 'used', value: 3230, color: '#ff8cc6' },
              { label: 'total', value: 10000, color: '#de369d' }
            ]"
            :extra="false"
            chart-type="ring"
            :colors="['#fff', 'rgb(59, 141, 255, 0.05)']"
            accent-color="rgb(59, 141, 255, 1)"
            chart-overlay-center-type="icon"
            chart-overlay-main="3230"
            chart-overlay-units="runs"
            chart-overlay-center="fad fa-tasks"
          />
        </v-col>
        <v-col cols="12" md="6">
          <ChartCard
            :chart-data="[
              { label: 'used', value: 1, color: '#ff8cc6' },
              { label: 'total', value: 3, color: '#de369d' }
            ]"
            :extra="false"
            chart-type="ring"
            :colors="['#fff', 'rgb(59, 141, 255, 0.05)']"
            accent-color="rgb(59, 141, 255, 1)"
            chart-overlay-center-type="icon"
            chart-overlay-main="1"
            chart-overlay-units="user"
            chart-overlay-center="fad fa-users"
          />
        </v-col>
      </v-row>

      <v-row no-gutters>
        <v-col cols="12">
          <UsageTimeline />
        </v-col>
      </v-row>

      <Profile />
      <License />
      <Billing />
      <ClearDataDialog />
    </div>

    <ManagementLayout v-else-if="isCloud">
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
      <LegacyLicense />
      <Users />
      <Billing />
      <ClearDataDialog />
    </ManagementLayout>

    <div v-else>
      <v-alert
        class="mx-auto mb-12"
        border="left"
        colored-border
        elevation="2"
        type="primary"
        tile
        prominent
        ><div>You are connected to Prefect Server. </div
        ><div>
          Account management is only available on
          <ExternalLink href="https://www.prefect.io/cloud"
            >Prefect Cloud</ExternalLink
          >
        </div>
      </v-alert>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.v-sheet.v-alert:not(.v-sheet--outlined) {
  padding-left: 25px;
}
</style>
