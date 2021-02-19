<script>
export default {
  components: {},
  props: {
    hook: {
      type: Object,
      required: true
    }
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
      },
      hookSwitch: true
    }
  },
  computed: {
    offOrOn() {
      return this.hookSwitch ? 'Off' : 'On'
    },
    includeTo() {
      return this.hook.event_type === 'FlowRunStateChangedEvent'
    },
    hookText() {
      const event = this.hook?.event_type
      // name is if a flow group is named on the evnt - to add later
      const name = ''
      return `${this.hookDetails[event]?.type} ${name} ${this.hookDetails[event]?.action}`
    },
    hookStates() {
      const states = this.hook?.event_tags?.state
      return states.toString().toLowerCase()
    },
    hookAction() {
      const action = this.hook?.action?.action_type
      return this.actionDetails[action]?.title
    },
    hookName() {
      return this.hook?.action?.name
    }
  }
}
</script>

<template>
  <v-card class="px-4 mb-2 headline " outlined>
    <v-row no-gutters>
      <v-col cols="11"></v-col>
      <v-col cols="1">
        <v-switch v-model="hookSwitch" inset color="primary"></v-switch
      ></v-col> </v-row
    ><v-row
      ><v-col class="pl-8 pb-8 pt-0" cols="12"
        ><v-icon color="codePink" class="pr-2">{{
          hookDetails[hook.event_type].icon
        }}</v-icon
        ><span class="font-weight-bold"> When {{ hookText }}</span>
        <span v-if="includeTo"> to {{ hookStates }}</span
        >, then <span class="font-weight-bold">{{ hookAction }}</span></v-col
      >
    </v-row></v-card
  >
</template>
