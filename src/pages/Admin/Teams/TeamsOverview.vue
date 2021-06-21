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
      loading: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'tenants']),
    ...mapGetters('license', ['permissions', 'license', 'planType']),
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
      } catch (e) {
        console.log(e)
      } finally {
        this.loading = false
      }
    },
    refetch() {
      this.getUser()
      this.$globalApolloQueries['tenants']?.refetch()
    }
  }
}
</script>

<template>
  <v-container fluid>
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
        class="mb-4"
        @click="handleSwitchTenant(team)"
        @refetch="refetch"
        @remove="handleRemoveTenant(team)"
      />
    </transition-group>
  </v-container>
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
