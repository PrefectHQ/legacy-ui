<script>
import ActionCard from '@/pages/Dashboard/Actions/ActionCard'
export default {
  components: {
    ActionCard
  },
  data() {
    return {
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
  <v-container class="ma-0 pa-0">
    <v-row>
      <v-col cols="9"> </v-col>
      <v-col cols="3" class="text-right">
        <v-btn dark color="codePink"
          ><v-icon class="pr-2">far fa-file-plus</v-icon> Add Action</v-btn
        >
      </v-col>
    </v-row>
    <v-row>
      <v-col v-for="(hook, i) in hooks" :key="i" cols="12">
        <ActionCard :hook="hook" />
      </v-col>
    </v-row>
  </v-container>
</template>
