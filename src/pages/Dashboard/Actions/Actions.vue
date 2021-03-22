<script>
import ActionCard from '@/pages/Dashboard/Actions/ActionCard'
import AddActionCard from '@/pages/Dashboard/Actions/AddActionCard'

export default {
  components: {
    ActionCard,
    AddActionCard
  },
  data() {
    return {
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
    sortedHooks() {
      const hooks = this.hooks ? [...this.hooks] : []
      const sorted = hooks.sort((a, b) => a.id - b.id)
      // return this.editHook ? [this.editHook, ...sorted] : sorted
      return sorted
    }
  },
  methods: {
    handleRefetch() {
      this.$apollo.queries.hooks.refetch()
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
        return require('@/graphql/Actions/hooks.gql')
      },
      variables() {
        return {}
      },
      loadingKey: 'loadingKey',
      pollInterval: 5000,
      update: data => data?.hook
    }
  }
}
</script>

<template>
  <div>
    <v-row>
      <v-col>
        <AddActionCard v-if="!closeCard" @refresh="handleRefresh" />
      </v-col>
    </v-row>
    <v-row>
      <v-col v-for="(hook, i) in sortedHooks" :key="i" cols="12">
        <ActionCard
          :hook="hook"
          @open-edit="handleEdit(hook, i)"
          @refetch="handleRefetch"
        />
      </v-col>
    </v-row>
  </div>
</template>
