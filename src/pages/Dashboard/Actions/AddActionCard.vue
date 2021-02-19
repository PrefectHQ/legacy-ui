<script>
export default {
  data() {
    return {
      chosenEventType: 'FlowRunStateChangedEvent',
      chosenStates: [],
      chosenAction: 'select',
      hookDetails: {
        FlowRunStateChangedEvent: {
          type: 'flow',
          action: 'changes state',
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
        },
        select: {
          title: '...'
        }
      }
    }
  },
  computed: {
    height() {
      return this.$vuetify.breakpoint.lgAndUp ? '75vh' : '60vh'
    },
    includeTo() {
      return this.chosenEventType === 'FlowRunStateChangedEvent'
    },
    hookText() {
      const event = this.chosenEventType
      // name is if a flow group is named on the evnt - to add later
      const name = '...'
      return `${this.hookDetails[event]?.type} ${name} ${this.hookDetails[event]?.action}`
    },
    hookStates() {
      const states = this.chosenStates
      return states.toString().toLowerCase() || '...'
    },
    hookAction() {
      const action = this.chosenAction
      return this.actionDetails[action]?.title
    }
  },
  methods: {
    closeCard() {
      this.$emit('close')
    }
  }
}
</script>

<template>
  <v-card width="100%" :height="height">
    <div class="text-right pa-2">
      <v-btn icon @click="closeCard"><v-icon>close</v-icon></v-btn>
    </div>
    <v-alert class="ma-12 pa-8" color="codePink" outlined>
      <v-row no-gutters></v-row>
      <v-row
        ><v-col cols="12" class="headline black--text"
          ><v-icon color="codePink" class="pr-2">{{
            hookDetails[chosenEventType].icon
          }}</v-icon
          ><span> When </span
          ><span class="font-weight-bold">{{ hookText }}</span>
          <span v-if="includeTo">
            to <span class="font-weight-bold">{{ hookStates }} </span></span
          >, then <span class="font-weight-bold">{{ hookAction }}</span></v-col
        >
      </v-row></v-alert
    >
  </v-card>
</template>
