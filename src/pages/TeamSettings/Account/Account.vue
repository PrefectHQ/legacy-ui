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
import UsageToday from '@/pages/TeamSettings/Account/Usage/UsageToday'
import CurrentUsers from '@/pages/TeamSettings/Account/Usage/CurrentUsers'
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
    UsageTimeline,
    CurrentUsers,
    UsageToday
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
    <v-container v-if="isCloud" fluid>
      <v-row>
        <v-col cols="12" class="text-center pb-2 ">
          <h1 class="display-1">Account & Usage</h1>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" class="text-center py-0">
          <div class="subtitle-1">
            Manage data associated with your team
          </div>
        </v-col>
      </v-row>

      <v-row class="usage-row">
        <v-col cols="12" class="usage-grid">
          <UsageTimeline class="usage" />
          <UsageToday class="runs" />
          <CurrentUsers class="users" />
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-row>
            <v-col cols="12">
              <Profile />
            </v-col>
            <v-col cols="12">
              <ClearDataDialog />
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="12" md="6">
          <v-row>
            <v-col cols="12">
              <License v-if="isUsageBased" />
              <LegacyLicense v-else />
            </v-col>
            <v-col cols="12">
              <Billing />
            </v-col>

            <v-col cols="12">
              <Users v-if="isUsageBased" />
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>

    <ManagementLayout v-else>
      <template #title>Account</template>

      <template v-if="isCloud" #subtitle>
        Update your team profile.
      </template>

      <Profile />
      <ClearDataDialog />
    </ManagementLayout>
  </div>
</template>

<style lang="scss" scoped>
.v-sheet.v-alert:not(.v-sheet--outlined) {
  padding-left: 25px;
}

.account-container {
  margin: auto;
  max-width: 1600px;
}

.usage-row {
  position: relative;

  .usage-grid {
    column-gap: 16px;
    display: grid;
    grid-template-areas:
      'usage runs'
      'usage users';
    grid-template-columns: 4fr 1fr;
    height: 500px;
    row-gap: 16px;
  }

  @media screen and (max-width: 960px) {
    .usage-grid {
      grid-template-areas:
        'usage usage'
        'runs users';
      grid-template-columns: auto;
      grid-template-rows: 4fr 1fr;
      height: 800px;
    }
  }

  .usage {
    grid-area: usage;
  }

  .runs {
    grid-area: runs;
  }

  .users {
    grid-area: users;
  }
}

.h-100 {
  height: 100%;
}

.h-50 {
  height: 50%;
}
</style>
