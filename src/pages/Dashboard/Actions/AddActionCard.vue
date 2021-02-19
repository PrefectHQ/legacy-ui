<script>
export default {
  data() {
    return {
      selectedEvent: false,
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
        },
        AgentSLAFailed: {
          type: 'agent',
          action: 'SLA fails',
          icon: 'pi-agent'
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
    colSize() {
      return 12 / this.hookTypes.length
    },
    hookTypes() {
      return Object.keys(this.hookDetails)
    },
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
    },
    handleSelectClick() {
      this.selectedEvent = true
    }
  }
}
</script>

<template>
  <v-card width="100%" :height="height">
    <div v-if="!selectedEvent" class="text-right pa-2">
      <v-btn icon @click="closeCard"><v-icon>close</v-icon></v-btn></div
    >
    <div v-if="selectedEvent" class="pb-12 pt-2 pl-2"
      ><v-btn
        text
        class="grey--text text--darken-2 light-weight-text"
        @click="selectedEvent = false"
      >
        <v-icon>chevron_left</v-icon
        ><span style="text-transform: none;">Back </span></v-btn
      >
    </div>

    <v-alert
      class="mx-8 pa-8"
      color="codePink"
      outlined
      @click="handleSelectClick"
    >
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
    <v-item-group>
      <v-row v-if="!selectedEvent" class="mx-8">
        <v-col
          v-for="(hook, i) in hookTypes"
          :key="i"
          v-model="chosenEventType"
          cols="12"
          :md="colSize"
          class="pl-0"
        >
          <v-alert
            :color="chosenEventType === hook ? 'white' : 'codePink'"
            :style="chosenEventType === hook ? 'opacity: 1;' : 'opacity: 0.5;'"
            :outlined="chosenEventType === hook ? false : true"
            :elevation="chosenEventType === hook ? '4' : '0'"
            height="200"
            @click="chosenEventType = hook"
          >
            <v-scroll-y-transition>
              <div width="100%">
                <div class="headline codePink--text text-center pa-8">
                  <v-icon color="codePink" class="pr-2">{{
                    hookDetails[hook].icon
                  }}</v-icon>
                  {{ hookDetails[hook].type }}
                  {{ hookDetails[hook].action }}
                </div>
                <div class="text-center">
                  <v-btn text color="primary" @click="chosenEventType = hook"
                    ><v-icon>add</v-icon>Add Hook</v-btn
                  ></div
                >
              </div>
            </v-scroll-y-transition>
          </v-alert>
        </v-col>
      </v-row>
    </v-item-group>
  </v-card>
</template>
