<script>
import { mapGetters, mapActions } from 'vuex'
import ManagementLayout from '@/layouts/ManagementLayout'
import { teamProfileMixin } from '@/mixins/teamProfileMixin.js'
import Profile from '@/pages/TeamSettings/Account/Profile'
import License from '@/pages/TeamSettings/Account/License'
import Billing from '@/pages/TeamSettings/Account/Billing'
import ClearDataDialog from '@/pages/TeamSettings/Account/ClearDataDialog'
import UsageToday from '@/pages/TeamSettings/Account/Usage/UsageToday'
import CurrentUsers from '@/pages/TeamSettings/Account/Usage/CurrentUsers'
import UsageTimeline from '@/pages/TeamSettings/Account/Usage/UsageTimeline'

export default {
  components: {
    ManagementLayout,
    Profile,
    ClearDataDialog,
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
      clearDataDialog: false,

      loadedTiles: 0,
      numberOfTiles: 9,
      refreshTimeout: null
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
  watch: {
    tenant(val, oldVal) {
      if (val?.id !== oldVal?.id) {
        this.loadedTiles = 0
        clearTimeout(this.refreshTimeout)
        this.refresh()
      }
    }
  },
  mounted() {
    this.refresh()
  },
  methods: {
    ...mapActions('license', ['getLicense']),
    refresh() {
      let start

      const animationDuration = 150

      const loadTiles = time => {
        if (!start) start = time

        const elapsed = time - start

        if (elapsed > this.loadedTiles * animationDuration + 500) {
          this.loadedTiles++
        }

        if (this.loadedTiles <= this.numberOfTiles) {
          requestAnimationFrame(loadTiles)
        }
      }

      requestAnimationFrame(loadTiles)
    }
  }
}
</script>

<template>
  <div>
    <v-container v-if="isCloud" fluid>
      <v-row>
        <v-col cols="12" class="text-center pb-2 ">
          <h1 class="text-h4">Account & Usage</h1>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" class="text-center py-0">
          <div class="text-subtitle-1">
            Manage data associated with your team
          </div>
        </v-col>
      </v-row>

      <v-row class="usage-row">
        <v-col cols="12" class="usage-grid">
          <v-skeleton-loader
            :loading="loadedTiles < 3"
            type="image"
            height="476"
            class="usage"
            transition="quick-fade"
            tile
          >
            <UsageTimeline />
          </v-skeleton-loader>

          <v-skeleton-loader
            :loading="loadedTiles < 2"
            type="image"
            height="230"
            min-height="230"
            class="runs"
            transition="quick-fade"
            tile
          >
            <UsageToday />
          </v-skeleton-loader>

          <v-skeleton-loader
            :loading="loadedTiles < 1"
            type="image"
            height="230"
            transition="quick-fade"
            class="users"
            tile
          >
            <CurrentUsers />
          </v-skeleton-loader>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="6">
          <v-row>
            <v-col cols="12">
              <v-skeleton-loader
                :loading="loadedTiles < 5"
                type="image"
                height="339"
                class="usage"
                transition="quick-fade"
                tile
              >
                <Profile />
              </v-skeleton-loader>
            </v-col>
            <v-col cols="12">
              <v-skeleton-loader
                v-if="isTenantAdmin"
                :loading="loadedTiles < 7"
                type="image"
                height="282"
                class="usage"
                transition="quick-fade"
                tile
              >
                <ClearDataDialog />
              </v-skeleton-loader>
            </v-col>
          </v-row>
        </v-col>
        <v-col cols="12" md="6">
          <v-row>
            <v-col cols="12">
              <v-skeleton-loader
                :loading="loadedTiles < 6"
                type="image"
                height="168"
                class="usage"
                transition="quick-fade"
                tile
              >
                <Billing />
              </v-skeleton-loader>
            </v-col>
            <v-col cols="12">
              <v-skeleton-loader
                :loading="loadedTiles < 4"
                type="image"
                height="463"
                class="usage"
                transition="quick-fade"
                tile
              >
                <License />
              </v-skeleton-loader>
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

<style lang="scss">
// stylelint-disable
.v-skeleton-loader__image {
  height: inherit !important;
}
// stylelint-enable
</style>
