<script>
import TeamListItem from '@/components/TeamListItem'
import { mapGetters } from 'vuex'

export default {
  components: {
    TeamListItem
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
      ].sort((a, b) => a.name > b.name)
    }
  },
  methods: {
    refetch() {
      this.$globalApolloQueries['tenants']?.refetch()
    }
  }
}
</script>

<template>
  <div>
    <v-container
      v-if="!multitenancy"
      class="text-h5 text-center blue-grey--text d-flex align-center justify-center"
      style="height: 400px;"
      fluid
    >
      <div>
        <i class="fad fa-lock-alt fa-3x" />
        <div class="mt-6">
          <span v-if="planType('ENTERPRISE')">
            Your plan doesn't include multi-tenancy;
          </span>
          <span v-else
            >Multi-tenancy is only available on Enterprise plans;</span
          >
          <br />contact
          <a class="font-weight-medium" href="sales@prefect.io"
            >sales@prefect.io</a
          >
          to learn more.
        </div>
      </div>
    </v-container>

    <v-container v-else fluid>
      <v-card
        class="utilGrayDark--text mx-auto new-team-button text-center mb-4"
        flat
        outlined
      >
        <v-card-text class="text-h6 font-weight-light">
          <v-icon>add</v-icon>
          New team
        </v-card-text>
      </v-card>

      <transition-group name="teams-wrapper" mode="out-in">
        <TeamListItem
          v-for="team in teams"
          :key="team.id"
          :team="team"
          class="mb-4"
          @refetch="refetch"
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
