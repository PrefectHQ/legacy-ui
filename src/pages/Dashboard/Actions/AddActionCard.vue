<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  data() {
    return {
      flow: '',
      project: '',
      selectedEvent: false,
      SLAType: 'SCHEDULED_NOT_STARTED',
      chosenEventType: 'FlowRunStateChangedEvent',
      chosenStates: [],
      chosenAction: '',
      seconds: 0,
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
      },
      SLATypes: [
        { name: 'starts but does not finish', enum: 'STARTED_NOT_FINISHED' },
        {
          name: 'is scheduled but does not start',
          enum: 'SCHEDULED_NOT_STARTED'
        }
      ]
    }
  },
  computed: {
    ...mapGetters('data', ['projects']),
    isSLA() {
      return (
        this.chosenEventType === 'FlowSLAFailedEvent' ||
        this.chosenEventType === 'AgentSLAFailed'
      )
    },
    SLATypeFormat() {
      const type = this.SLATypes?.filter(sla => sla.enum === this.SLAType)[0]
        ?.name
      return type?.toString()
    },
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
      let action
      if (this.chosenAction?.length > 1) {
        action = this.chosenAction?.map(chosen => {
          const chosenName = this.actions?.filter(
            action => action.id === chosen
          )[0]?.name
          return chosenName
        })
      }
      action = this.actions?.filter(
        action => action.id === this.chosenAction[0]
      )[0]?.name

      return action?.length > 0 ? action.toString() : '...action(s)'
    },
    completeAction() {
      if (!this.includeTo) return !!this.chosenEventType && !!this.chosenAction
      return (
        !!this.chosenAction &&
        !!this.chosenStates.length &&
        !!this.chosenEventType
      )
    },
    flowName() {
      const name = this.flows?.filter(
        flow => flow.flow_group_id === this.flow
      )[0]?.name
      return name || 'named ...'
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    closeCard() {
      this.$emit('close')
    },
    handleSelectClick() {
      this.selectedEvent = true
    },
    async createHook() {
      let data
      try {
        if (this.chosenEventType === 'FlowRunStateChangedEvent') {
          const flowRunStateChangedSuccess = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/create_flow_run_state_changed_hook.gql'),
            variables: {
              input: {
                //flow_group_id not working??
                flow_group_ids: [this.flow],
                action_id: this.chosenAction[0],
                states: this.chosenStates
              }
            }
          })
          data = flowRunStateChangedSuccess.data
        }
        if (this.chosenEventType === 'FlowSLAFailedEvent') {
          const configId = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/create_flow_sla.gql'),
            variables: {
              input: {
                kind: this.SLAType,
                duration_seconds: Number(this.seconds)
              }
            }
          })
          console.log('config id', configId)
          const addConfigToFlow = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/add_config_to_flow.gql'),
            variables: {
              input: {
                flow_sla_config_id: configId.data.create_flow_sla_config.id,
                flow_group_id: this.flow
              }
            }
          })
          console.log(addConfigToFlow)
          const flowSLAEventSuccess = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/create_flow_sla_failed_hook.gql'),
            variables: {
              input: {
                action_id: this.chosenAction[0],
                sla_config_ids: [configId.data.create_flow_sla_config.id]
              }
            }
          })
          console.log(flowSLAEventSuccess)
          data = flowSLAEventSuccess.data
        }
        console.log('data', data)
      } catch (error) {
        const errString = `${error}`
        this.setAlert({
          alertShow: true,
          alertMessage: errString,
          alertType: 'error'
        })
      } finally {
        ///needs updating
      }
    }
  },
  apollo: {
    flows: {
      query: require('@/graphql/Actions/flows.gql'),
      variables() {
        return {
          project: this.project
        }
      },
      skip() {
        return !this.project
      },
      update: data => {
        return data.flow
      }
    },
    actions: {
      query: require('@/graphql/Actions/actions.gql'),
      update: data => {
        return data.action
      }
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
                  v-model="project"
                  :items="projects"
                  item-text="name"
                  item-value="id"
                  class="pa-4"
                  label="Select Project"
                  >{{ project.name }}</v-autocomplete
                >
                <v-autocomplete
                  v-model="flow"
                  :disabled="!project"
                  item-text="name"
                  item-value="flow_group_id"
                  class="pa-4"
                  label="Select Flow"
                  :items="flows"
                  >{{ flow.name }}</v-autocomplete
                ></v-card-actions
              >
            </v-card> </v-menu
          ><span v-if="!isSLA"> {{ hookEvent }}</span
          ><span v-else
            >{{ ' ' }}
            <v-menu :disabled="!selectedEvent" :close-on-content-click="false">
              <template #activator="{ on, attrs }">
                <v-btn
                  :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                  class="px-0 pb-1 headline text-decoration-underline text--secondary"
                  text
                  v-bind="attrs"
                  v-on="on"
                >
                  {{ SLATypeFormat }}</v-btn
                ></template
              ></v-menu
            >
            for
            <v-menu :disabled="!selectedEvent" :close-on-content-click="false">
              <template #activator="{ on, attrs }">
                <v-btn
                  :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                  class="px-0 pb-1 headline text-decoration-underline text--secondary"
                  text
                  v-bind="attrs"
                  v-on="on"
                >
                  {{ seconds || '...' }}</v-btn
                ></template
              >
              <v-card
                ><v-card-text>
                  <v-text-field
                    v-model="seconds"
                    min-width="50px"
                    type="number"
                  ></v-text-field>
                </v-card-text>
              </v-card>
            </v-menu>
            seconds</span
          >
          <span v-if="includeTo">
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
                    :items="['Failed', 'Success']"
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
                  :items="actions"
                  item-text="name"
                  item-value="id"
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
      <v-spacer /><v-btn
        large
        color="primary"
        :disabled="!completeAction"
        @click="createHook"
        ><v-icon class="pr-2">far fa-file-plus</v-icon>Save Action</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
