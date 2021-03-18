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
  methods: {
    openEdit(hookAndConfig) {
      this.hookConfig = hookAndConfig
      this.addAction = true
    },
    closeCard() {
      this.addAction = false
      this.hookConfig = null
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
  <div class="ma-4 pa-0">
    <v-row v-if="!addAction && hooks.length" class="pt-0 mt-0">
      <v-col cols="0" sm="9" class="pt-0"> </v-col>
      <v-col cols="12" sm="3" class="text-right pt-0 mb-2">
        <v-btn dark color="codePink" @click="addAction = true"
          ><v-icon class="pr-2">far fa-file-plus</v-icon> Add Action</v-btn
        >
      </v-col>
    </v-row>
    <v-row v-if="!hooks.length && !addAction" class="pt-0 mt-0">
      <v-col cols="12" class="pt-0  text-center">
        <div
          class="headline
          utilGreyDark--text pl-8 pr-12 pt-8 pb-4 text-center wide"
        >
          You have no
          <span class="font-weight-medium"> Actions! </span>
        </div>
        <v-btn dark color="codePink" @click="addAction = true"
          ><v-icon class="pr-2">far fa-file-plus</v-icon> Add Action</v-btn
        >
      </v-col>
    </v-row>
    <v-row v-if="!addAction" class="pa-0 ma-0">
      <v-col v-for="(hook, i) in hooks" :key="i" cols="12" class="pa-0 ma-0">
        <ActionCard :hook="hook" @edit-action="openEdit" />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-scale-transition v-if="addAction">
          <AddActionCard :hook-detail="hookConfig" @close="closeCard" />
        </v-scale-transition>
      </v-col>
    </v-row>
  </div>
</template>
