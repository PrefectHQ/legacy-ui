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
      hookDetails: {
        FlowRunStateChangedEvent: {
          type: 'flow',
          action: 'changes',
          icon: 'pi-flow'
        },
        FlowSLAFailedEvent: {
          type: 'flow',
          action: 'SLA fails',
          icon: 'pi-flow'
        }
      },
      actionDetails: {
        SlackNotificationAction: {
          title: 'send a slack notification'
        }
      }
    }
  },
  methods: {
    includeTo(hook) {
      return hook.event_type === 'FlowRunStateChangedEvent'
    },
    hookText(hook) {
      const event = hook?.event_type
      // name is if a flow group is named on the evnt - to add later
      const name = ''
      return `${this.hookDetails[event]?.type} ${name} ${this.hookDetails[event]?.action}`
    },
    hookStates(hook) {
      const states = hook?.event_tags?.state
      return states.toString().toLowerCase()
    },
    hookAction(hook) {
      const action = hook?.action?.action_type
      const name = hook?.action?.name
      return name || this.actionDetails[action]?.title
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
    <v-row v-if="!addAction" class="pt-0 mt-0">
      <v-col cols="0" sm="9" class="pt-0"> </v-col>
      <v-col cols="12" sm="3" class="text-right pt-0">
        <v-btn dark color="codePink" @click="addAction = true"
          ><v-icon class="pr-2">far fa-file-plus</v-icon> Add Action</v-btn
        >
      </v-col>
    </v-row>
    <v-row v-if="!addAction">
      <v-col v-for="(hook, i) in hooks" :key="i" cols="12">
        <ActionCard :hook="hook" />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-scale-transition v-if="addAction">
          <AddActionCard @close="addAction = false" />
        </v-scale-transition>
      </v-col>
    </v-row>
  </div>
</template>
