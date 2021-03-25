<script>
import AutoCard from '@/pages/Dashboard/Automations/AutoCard'
import AddAutoCard from '@/pages/Dashboard/Automations/AddAutoCard'
import { mapGetters } from 'vuex'

export default {
  components: {
    AutoCard,
    AddAutoCard
  },
  data() {
    return {
      loadingHook: 0,
      closeCard: false,
      editHook: null,
      editAction: null,
      addAction: false,
      hookConfig: null,
      hookDetails: {
        RunStateChangedEvent: {
          type: 'flow',
          action: 'changes',
          icon: 'pi-flow'
        },
        FlowSLAFailedEvent: {
          type: 'flow',
          action: 'SLA fails',
          icon: 'pi-flow'
        }
      }
    }
  },
  computed: {
    ...mapGetters('license', ['permissions']),
    sortedHooks() {
      const hooks = this.hooks ? [...this.hooks] : []
      const sorted = hooks.sort(
        (a, b) => new Date(b.created) - new Date(a.created)
      )
      return sorted
    },
    noAccess() {
      return !this.permissions?.find(item => item === 'read:hook')
    },
    canEdit() {
      return !!this.permissions?.find(item => item === 'create:hook')
    }
  },
  methods: {
    async handleRefetch() {
      this.loadingHook++
      this.handleRefresh()
      await this.$apollo.queries.hooks.refetch()
      this.loadingHook = 0
    },
    handleEdit(hook, index) {
      this.editHook = hook
      this.editAction = index
    },
    handleRefresh() {
      this.closeCard = true
      this.$nextTick(() => (this.closeCard = false))
    }
  },
  apollo: {
    hooks: {
      query() {
        return require('@/graphql/Automations/hooks.gql')
      },
      variables() {
        return {}
      },
      loadingKey: 'loadingHook',
      pollInterval: 5000,
      update: data => data?.hook
    }
  }
}
</script>

<template>
  <div v-if="noAccess">
    <v-row>
      <v-col cols="12" class="text-center text-h6 pa-12">
        You do not have access to Automations. If you'd like to be able to
        create automations that notify you (or even cancel your run) when
        there's a change in your agent or a run,
        <router-link :to="{ name: 'plans' }">upgrade</router-link> your account.
      </v-col>
    </v-row>
  </div>
  <div v-else>
    <v-row>
      <v-col>
        <div class="overline">New Automation</div>
        <AddAutoCard v-if="canEdit && !closeCard" @refresh="handleRefresh" />
      </v-col>
    </v-row>
    <v-row>
      <v-col v-for="(hook, i) in sortedHooks" :key="i" cols="12">
        <v-skeleton-loader
          v-if="loadingHook > 0 || closeCard"
          type="list-item-avatar-three-line"
        ></v-skeleton-loader>
        <AutoCard
          v-else
          :hook="hook"
          :can-edit="canEdit"
          @open-edit="handleEdit(hook, i)"
          @refetch="handleRefetch"
        />
      </v-col>
    </v-row>
  </div>
</template>
