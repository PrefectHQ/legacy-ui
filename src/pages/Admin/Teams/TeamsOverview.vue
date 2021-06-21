<script>
import TeamListItem from '@/components/TeamListItem'
import { mapActions, mapGetters } from 'vuex'
import { clearCache } from '@/vue-apollo'

export default {
  components: {
    TeamListItem
  },
  data() {
    return {
      loading: false,
      loadingKey: 0
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'tenants']),
    ...mapGetters('license', [
      'hasPermission',
      'permissions',
      'license',
      'planType'
    ]),
    atTeamLimit() {
      return this.license?.terms?.tenants <= this.teams.length
    },
    multitenancy() {
      return this.license?.terms?.tenants > 1
    },
    teams() {
      return [
        ...this.tenants?.filter(t => t.license_id == this.license?.id)
      ].sort((a, b) =>
        a.id == this.tenant.id
          ? -1
          : b.id == this.tenant.id
          ? 1
          : new Date(a.created) > new Date(b.created)
      )
    }
  },
  methods: {
    ...mapActions('alert', ['addNotification', 'updateNotification']),
    ...mapActions('data', ['resetData']),
    ...mapActions('tenant', ['setCurrentTenant']),
    ...mapActions('user', ['getUser']),
    async handleSwitchTenant(tenant) {
      if (tenant.slug == this.tenant.slug) return

      this.loading = true

      this.resetData()

      await this.setCurrentTenant(tenant.slug)

      clearCache()
      this.loading = false
    },
    async handleRemoveTenant(tenant) {
      this.loading = true

      const notificationId = await this.addNotification({
        color: 'primaryLight',
        loading: true,
        text: 'Deleting team...',
        dismissable: false
      })

      try {
        console.log(tenant)

        const res = await this.$apollo.mutate({
          mutation: require('@/graphql/Tenant/delete-enterprise-tenant.gql'),
          variables: {
            input: {
              tenant_id: tenant.id,
              confirm: true
            }
          }
        })

        console.log(res)

        await this.getUser()
        await this.$globalApolloQueries['tenants']?.refetch()

        this.resetData()

        clearCache()
        sessionStorage.setItem('haltTenantRouting', true)

        await this.updateNotification({
          id: notificationId,
          notification: {
            color: 'primary',
            text: `${tenant.name} deleted.`,
            loading: false,
            dismissable: true,
            timeout: 15000
          }
        })
      } catch (e) {
        console.log(e)
        await this.updateNotification({
          id: notificationId,
          notification: {
            color: 'error',
            loading: false,
            text:
              'There was a problem deleting your team. If the issue persists, contact help@prefect.io.',
            subtext: e,
            dismissable: true,
            timeout: 10000
          }
        })
      } finally {
        this.loading = false
      }
    },
    refetch() {
      this.getUser()
      this.$globalApolloQueries['tenants']?.refetch()
    }
  },
  apollo: {
    users: {
      query: require('@/graphql/Account/license-users.gql'),
      loadingKey: 'loadingKey',
      skip() {
        return !this.hasPermission('license', 'admin')
      },
      update(data) {
        if (!data) return
        return data.license_users
      },
      fetchPolicy: 'no-cache'
    }
  }
}
</script>

<template>
  <div>
    <v-container
      v-if="!hasPermission('license', 'admin')"
      class="text-h5 text-center blue-grey--text d-flex align-center justify-center"
      style="height: 400px;"
      fluid
    >
      <div>
        <i class="fad fa-lock-alt fa-3x" />
        <div class="mt-6">
          <span v-if="planType('ENTERPRISE')">
            You don't have permission to view license teams; contact your
            license administrator to get access.
          </span>
          <span v-else
            >Multi-tenancy is only available on Enterprise plans.</span
          >
        </div>
      </div>
    </v-container>

    <v-container v-else fluid>
      <div class="mx-4 mb-4 d-flex align-center justify-end">
        <div class="mr-auto text-h5 font-weight-light" @click="refetch">
          {{ teams.length }}/{{ license.terms.tenants }} team slots used
        </div>

        <v-btn
          :to="{ path: '/admin/teams/new' }"
          color="primary"
          depressed
          :disabled="atTeamLimit"
        >
          <v-icon class="mr-2" small>add</v-icon>New
        </v-btn>
      </div>

      <transition-group name="teams-wrapper" mode="out-in">
        <TeamListItem
          v-for="team in teams"
          :key="team.id"
          :team="team"
          :loading="loading"
          :users="
            users
              ? users.filter(
                  u => u.memberships.findIndex(m => m.tenant_id == team.id) > -1
                )
              : []
          "
          class="mb-4"
          @click="handleSwitchTenant(team)"
          @refetch="refetch"
          @remove="handleRemoveTenant(team)"
        />
      </transition-group>
    </v-container>
  </div>
</template>

<style lang="scss" scoped>
.teams-wrapper {
  height: 100vh;
  pointer-events: none;
  position: fixed;
  width: 100%;
  z-index: 1000;

  &-enter,
  &-leave-to,
  &-leave-active {
    opacity: 0;
    transform: translateY(30px);
  }

  &-leave-active {
    position: absolute;
  }
}

.new-team-button {
  border-style: dotted;
  border-width: 2px;
  max-width: 400px;
}
</style>
