<script>
import CardTitle from '@/components/Card-Title'
import AutoCard from '@/pages/Dashboard/Automations/AutomationCard'

export default {
  components: {
    CardTitle,
    AutoCard
  },
  props: {
    flow: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      loadingHook: 0,
      loadCards: false,
      hookConfig: null,
      sortedHooks: []
    }
  },
  watch: {
    hooks() {
      this.sortHooks()
    }
  },
  methods: {
    sortHooks() {
      this.loadCards = true
      const hooks = this.hooks ? [...this.hooks] : []
      const filtered = hooks.filter(
        hook => hook.event_tags.flow_group_id == this.flow.flow_group_id
      )
      const sorted = filtered.sort(
        (a, b) => new Date(b.created) - new Date(a.created)
      )
      this.sortedHooks = sorted
      this.loadCards = false
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
  <v-card class="pa-2 mt-2" tile>
    <CardTitle title="Automations" icon="fa-random" />

    <v-card-text class="full-height position-relative">
      <div
        >Displaying automations for this flow. To see all automations or manage
        automations go to the main
        <router-link :to="{ name: 'dashboard', query: { automations: '' } }"
          >dashboard</router-link
        >.</div
      >
      <v-row>
        <v-col cols="12" class="pb-0"> </v-col>
        <v-progress-circular
          v-if="!sortedHooks.length && loadingHook > 0"
          class="mx-auto my-4"
          indeterminate
          color="primary"
        />

        <v-col v-for="(hook, i) in sortedHooks" :key="i" cols="12">
          <v-skeleton-loader
            v-if="loadingHook > 0 || loadCards"
            type="list-item-avatar-three-line"
            height="72"
          ></v-skeleton-loader
          ><AutoCard v-else :hook="hook" :can-edit="false" />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.full-height {
  min-height: 68vh;
}
</style>
