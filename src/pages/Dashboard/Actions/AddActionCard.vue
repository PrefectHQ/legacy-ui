<script>
export default {
  data() {
    return {
      flowName: '',
      projectName: '',
      selectedEvent: false,
      chosenEventType: 'FlowRunStateChangedEvent',
      chosenStates: [],
      chosenAction: '',
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
    hookType() {
      return `${this.hookDetails[this.chosenEventType]?.type} `
    },
    typeName() {
      return ' named...'
    },
    hookEvent() {
      return `${this.hookDetails[this.chosenEventType]?.action}`
    },
    hookStates() {
      return this.chosenStates?.toString().toLowerCase() || '... state'
    },
    hookAction() {
      const action = this.chosenAction
      return this.actionDetails[action]?.title || '...action(s)'
    },
    completeAction() {
      const disabled2 = !!this.chosenEventType && !!this.chosenAction
      console.log(disabled2)
      if (!this.includeTo) return disabled2
      const disabled =
        !!this.chosenAction &&
        !!this.chosenStates.length &&
        !!this.chosenEventType
      console.log(disabled)
      return disabled
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
          }}</v-icon>
          When {{ hookType
          }}<v-menu :disabled="!selectedEvent" :close-on-content-click="false">
            <template #activator="{ on, attrs }">
              <v-btn
                :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                class="px-0 pb-1 headline text-decoration-underline text--secondary"
                text
                v-bind="attrs"
                v-on="on"
                >{{ flowName || typeName }}</v-btn
              ></template
            >
            <v-card
              ><v-card-actions>
                <v-autocomplete
                  v-model="projectName"
                  :items="['project1', 'project2']"
                  >{{ projectName }}</v-autocomplete
                >
                <v-autocomplete
                  v-model="flowName"
                  :disabled="!projectName"
                  :items="['flow1', 'flow2']"
                  >{{ flowName }}</v-autocomplete
                ></v-card-actions
              >
            </v-card>
          </v-menu>
          {{ hookEvent
          }}<span v-if="includeTo">
            to
            <v-menu :close-on-content-click="false" :disabled="!selectedEvent">
              <template #activator="{ on, attrs }">
                <v-btn
                  :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                  class="px-0 pb-1 headline text-decoration-underline text--secondary"
                  text
                  v-bind="attrs"
                  v-on="on"
                  >{{ hookStates }}</v-btn
                ></template
              >
              <v-card
                ><v-card-actions>
                  <v-autocomplete
                    v-model="chosenStates"
                    multiple
                    :items="['failed', 'success']"
                    >{{ hookStates }}</v-autocomplete
                  >
                </v-card-actions>
              </v-card>
            </v-menu></span
          >, then
          <v-menu :close-on-content-click="false" :disabled="!selectedEvent">
            <template #activator="{ on, attrs }">
              <v-btn
                :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                class="px-0 pb-1 headline text-decoration-underline text--secondary"
                text
                v-bind="attrs"
                v-on="on"
                >{{ hookAction }}</v-btn
              ></template
            >
            <v-card
              ><v-card-actions>
                <v-autocomplete
                  v-model="chosenAction"
                  multiple
                  :items="['select', 'SlackNotificationAction']"
                  >{{ chosenAction }}</v-autocomplete
                >
              </v-card-actions>
            </v-card> </v-menu
          >.</v-col
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
    <v-card-actions v-if="selectedEvent" class="px-8">
      <v-spacer /><v-btn large color="primary" :disabled="!completeAction"
        ><v-icon class="pr-2">far fa-file-plus</v-icon>Save Action</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
