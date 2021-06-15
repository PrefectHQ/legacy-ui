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
    multitenancy() {
      return this.license?.terms?.tenants > 1
    },
    teams() {
      return [
        ...this.tenants?.filter(t => t.license_id == this.license?.id)
      ].sort((a, b) => new Date(a.created) > new Date(b.created))
    }
  },
  methods: {
    ...mapActions('data', ['resetData']),
    ...mapActions('tenant', ['setCurrentTenant']),
    async handleSwitchTenant(tenant) {
      if (tenant.slug == this.tenant.slug) return

      this.loading = true

      this.resetData()

      await this.setCurrentTenant(tenant.slug)

      clearCache()
      this.loading = false
    },
    refetch() {
      this.$globalApolloQueries['tenants']?.refetch()
    }
  }
}
</script>

<template>
  <v-container fluid>
    <div class="mx-4 mb-4 d-flex align-center justify-end">
      <v-btn :to="{ path: '/admin/teams/new' }" color="primary" depressed>
        <v-icon class="mr-2" small>add</v-icon>New
      </v-btn>
    </div>

    <transition-group name="teams-wrapper" mode="out-in" class="d-flex">
      <TeamListItem
        v-for="team in teams"
        :key="team.id"
        :team="team"
        :loading="loading"
        class="mb-4"
        @click="handleSwitchTenant(team)"
        @refetch="refetch"
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

  .snackbars-snack {
    pointer-events: auto;
    transition: all 0.5s;
  }

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
