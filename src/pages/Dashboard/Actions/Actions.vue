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
    handleEdit(a, b, c) {
      console.log('clicked', a, b, c)
      this.editHook = a
      this.editAction = b
    }
    // closeCard() {
    //   this.addAction = false
    //   this.hookConfig = null
    // }
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
    <!-- <v-row v-if="!addAction && hooks.length" class="pt-0 mt-0">
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
    </v-row> -->
    <v-row>
      <v-col>
        <AddActionCard />
      </v-col>
    </v-row>
    <v-row>
      <v-col v-for="(hook, i) in sortedHooks" :key="i" cols="12">
        <ActionCard :hook="hook" @open-edit="handleEdit(hook, i)" />
      </v-col>
    </v-row>
  </div>
</template>
