<script>
import { mapActions, mapGetters } from 'vuex'
import AddDoThis from '@/pages/Dashboard/Actions/AddDoThis'

export default {
  components: {
    AddDoThis
  },
  props: {
    hookDetail: {
      type: Object,
      required: false,
      default: null
    }
  },
  data() {
    return {
      flow: '',
      hookDetails: this.hookDetail,
      project: '',
      selectedEvent: false,
      flowEventType: '',
      chosenEventType: '',
      chosenStates: [],
      chosenAction: '',
      seconds: 60,
      addAction: false,
      //   flowHookDetails: [
      //     {
      //       name: 'FlowRunStateChangedEvent',
      //       type: 'flow',
      //       action: 'changes',
      //       icon: 'pi-flow'
      //     },
      //     {
      //       name: 'FlowSLAFailedEvent',
      //       type: 'flow',
      //       action: 'SLA fails',
      //       icon: 'pi-flow'
      //     }
      //   ],
      //   agentHookDetails: [
      //     {
      //       name: 'AgentSLAFailed',
      //       type: 'agent',
      //       action: 'SLA fails',
      //       icon: 'pi-agent'
      //     }
      //   ],
      actionDetails: {
        SlackNotificationAction: {
          title: 'send a slack notification'
        },
        select: {
          title: '...'
        }
      },
      flowEventTypes: [
        { name: 'starts but does not finish', enum: 'STARTED_NOT_FINISHED' },
        {
          name: 'does not start at the scheduled start time',
          enum: 'SCHEDULED_NOT_STARTED'
        },
        {
          name: 'changes state to',
          enum: 'CHANGES_STATE'
        }
      ]
    }
  },
  computed: {
    ...mapGetters('data', ['projects']),
    iconType() {
      return this.chosenEventType === 'agent' ? 'pi-agent' : 'pi-flow'
    },
    agentOrFlow() {
      if (this.hookDetails?.flowName) return 'flow'
      if (!this.chosenEventType) return 'agent or flow'
      return this.chosenEventType
    },
    isSLA() {
      return (
        this.hookDetails?.flowConfig?.kind ||
        this.flowEventType === 'STARTED_NOT_FINISHED' ||
        this.flowEventType == 'SCHEDULED_NOT_STARTED'
      )
    },
    editedActions() {
      return this.actions
        ? [...this.actions, { name: 'cancel that run', value: 'CANCEL_RUN' }]
        : [{ name: 'cancel that run', value: 'CANCEL_RUN' }]
    },
    eventTypeFormat() {
      if (this.flowEventType) {
        const type = this.flowEventTypes?.filter(
          sla => sla.enum === this.flowEventType
        )[0]?.name
        return type?.toString() || 'does something'
      }
      if (this.hookDetails?.flowName) {
        if (this.hookDetails.flowConfig) {
          const type = this.flowEventTypes?.filter(
            sla => sla.enum === this.hookDetails?.flowConfig?.kind
          )[0]?.name
          return type?.toString()
        } else {
          return 'changes state to'
        }
      }
      return 'does something'
    },
    // colSize() {
    //   return 12 / this.hookTypes.length
    // },
    // hookTypes() {
    //   return Object.keys(this.hookDetails)
    // },
    includeTo() {
      return (
        this.flowEventType == 'CHANGES_STATE' ||
        this.hookDetails?.hook?.event_type === 'FlowRunStateChangedEvent'
      )
    },
    durationSeconds() {
      return this.seconds || this.hookDetails?.flowConfig?.duration_seconds
    },

    // hookType() {
    //   return `${} `
    // },
    // typeName() {
    //   return ' name'
    // },
    // hookEvent() {
    //   return `${this.hookDetails[this.chosenEventType]?.action}`
    // },
    hookStates() {
      this.hookDetails?.hook?.event_tags?.state?.toString().toLowerCase()
      return (
        this.chosenStates?.toString().toLowerCase() ||
        this.hookDetails?.hook?.event_tags?.state?.toString().toLowerCase() ||
        'state'
      )
    },
    hookAction() {
      if (this.hookDetails?.hook?.action)
        return this.hookDetails?.hook?.action?.name
      let action
      if (this.chosenAction?.length > 1) {
        let chosenName
        action = this.chosenAction?.map(chosen => {
          chosenName = this.actions?.filter(action => action.id === chosen)[0]
            ?.name
          if (chosen === 'CANCEL_RUN') {
            console.log('cancel')
            chosenName = 'cancel that run'
          }
          return chosenName
        })
      }
      action = this.actions?.filter(
        action => action.id === this.chosenAction[0]
      )[0]?.name

      return action?.length > 0 ? action.toString() : 'do this'
    },
    completeAction() {
      if (this.hookDetail) return true
      if (!this.includeTo) return !!this.chosenEventType && !!this.chosenAction
      return (
        !!this.chosenAction &&
        !!this.chosenStates.length &&
        !!this.chosenEventType
      )
    },
    agentName() {
      const name = this.agents?.filter(agent => agent.id === this.agent)[0]
        ?.name
      return name || '???'
    },
    flowName() {
      if (this.flow) {
        return this.flows?.filter(flow => flow.flow_group_id === this.flow)[0]
          ?.name
      }
      if (this.hookDetails?.flowName) return this.hookDetails?.flowName[0]?.name
      return '???'
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    closeCard() {
      this.$emit('close')
    },
    // handleSelectClick() {
    //   this.selectedEvent = true
    // },
    async createAction(cancel) {
      if (cancel) {
        await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create_action.gql'),
          variables: {
            input: { config: { cancel_flow_run: {} } }
          }
        })
      }
    },
    async createHook() {
      let data
      const flow = this.flow || this.hookDetails?.flowName[0]?.flow_group_id
      const action = this.chosenAction[0] || this.hookDetails?.hook?.action?.id
      if (action === 'CANCEL_RUN') {
        this.createAction(true)
      }
      try {
        if (this.chosenEventType === 'flow' || this.hookDetails?.flowName[0]) {
          if (this.includeTo) {
            const states = this.chosenStates.length
              ? this.chosenStates
              : this.hookDetails?.hook?.event_tags?.state
            const flowRunStateChangedSuccess = await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/create_flow_run_state_changed_hook.gql'),
              variables: {
                input: {
                  flow_group_ids: [flow],
                  action_id: action,
                  states: states
                }
              }
            })
            data = flowRunStateChangedSuccess.data
          }
          if (this.isSLA) {
            const kind =
              this.flowEventType || this.hookDetails?.flowConfig?.kind

            const configId = await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/create_flow_sla.gql'),
              variables: {
                input: {
                  kind: kind,
                  duration_seconds: Number(this.durationSeconds)
                }
              }
            })
            await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/add_config_to_flow.gql'),
              variables: {
                input: {
                  flow_sla_config_id: configId.data.create_flow_sla_config.id,
                  flow_group_id: flow
                }
              }
            })
            const flowSLAEventSuccess = await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/create_flow_sla_failed_hook.gql'),
              variables: {
                input: {
                  action_id: action,
                  sla_config_ids: [configId.data.create_flow_sla_config.id]
                }
              }
            })
            data = flowSLAEventSuccess.data
          }
          if (data && this.hookDetails) {
            await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/delete-hook.gql'),
              variables: {
                hookId: this.hookDetails.hook.id
              }
            })
          }
        }
      } catch (error) {
        const errString = `${error}`
        this.setAlert({
          alertShow: true,
          alertMessage: errString,
          alertType: 'error'
        })
      } finally {
        this.hookDetails = null
        //needs updating - alert simply for deving at the mo
        if (data) {
          this.setAlert({
            alertShow: true,
            alertMessage: 'hook created',
            alertType: 'success'
          })
          this.closeCard()
        }
      }
    }
  },
  apollo: {
    flows: {
      query: require('@/graphql/Actions/flows.gql'),
      variables() {
        return {
          //   project: this.project
        }
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
  <v-card width="100%">
    <!-- <div v-if="!selectedEvent" class="text-right pa-2">
      <v-btn icon @click="closeCard"><v-icon>close</v-icon></v-btn></div
    > -->
    <div class="pb-2 pt-2 pl-2"
      ><v-btn
        text
        class="grey--text text--darken-2 light-weight-text"
        @click="closeCard"
      >
        <v-icon>chevron_left</v-icon
        ><span style="text-transform: none;">Back </span></v-btn
      >
    </div>

    <v-card class="px-8" elevation="0" height="20vh">
      <v-row
        ><v-col cols="12" class="headline black--text"
          ><v-icon color="codePink" class="pr-2">{{ iconType }}</v-icon>
          When the
          <v-menu
            :close-on-content-click="false"
            content-class="elevation-0"
            nudge-bottom="48"
            nudge-left="150"
          >
            <template #activator="{ on, attrs }">
              <v-btn
                :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                class="px-0 pb-1 headline text-decoration-underline text--secondary"
                text
                position-x="50"
                v-bind="attrs"
                v-on="on"
                >{{ agentOrFlow }}</v-btn
              ></template
            >
            <div v-if="!chosenEventType" elevation="0" class="pl-12 ml-12">
              <v-chip
                v-for="item in ['flow', 'agent']"
                :key="item"
                label
                class="mx-2"
                outlined
                @click="chosenEventType = item"
                ><v-icon class="pr-2">{{
                  item === 'flow' ? 'pi-flow' : 'pi-agent'
                }}</v-icon
                >{{ item }}</v-chip
              >
            </div>
            <v-card
              v-if="chosenEventType === 'flow'"
              max-height="100px"
              width="1250px"
              :style="{ overflow: 'auto' }"
            >
              <v-chip
                v-for="item in flows"
                :key="item"
                label
                class="mx-2"
                outlined
                @click="flow = item"
                >{{ item.name }}({{ item.project }})</v-chip
              >
            </v-card>
          </v-menu>
          named
          <v-menu
            v-if="chosenEventType !== 'agent'"
            :close-on-content-click="false"
          >
            <template #activator="{ on, attrs }">
              <v-btn
                :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                class="px-0 pb-1 headline text-decoration-underline text--secondary"
                text
                v-bind="attrs"
                v-on="on"
                >{{ flow.name }}</v-btn
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
                  label="Which project?"
                  >{{ project.name }}</v-autocomplete
                >
                <v-autocomplete
                  v-model="flow"
                  :disabled="!project"
                  item-text="name"
                  item-value="flow_group_id"
                  class="pa-4"
                  label="Which flow?"
                  :items="flows"
                  >{{ flow.name }}</v-autocomplete
                ></v-card-actions
              >
            </v-card>
          </v-menu>
          <v-menu v-else :close-on-content-click="false">
            <template #activator="{ on, attrs }">
              <v-btn
                :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                class="px-0 pb-1 headline text-decoration-underline text--secondary"
                text
                v-bind="attrs"
                v-on="on"
                >{{ agentName }}</v-btn
              ></template
            >
            <v-card>
              <!-- <v-card-actions>
                <v-autocomplete
                  v-model="agent"
                  item-text="name"
                  item-value="id"
                  class="pa-4"
                  label="Which agent?"
                  :items="agents"
                  >{{ agent }}</v-autocomplete
                ></v-card-actions
              > -->
            </v-card>
          </v-menu>

          <!-- <span> {{ hookEvent }}</span> -->
          <span
            >{{ ' '
            }}<span
              v-if="
                chosenEventType === 'flow' ||
                  (hookDetails && hookDetails.flowName)
              "
              >has a flow run that
            </span>
            <v-menu :close-on-content-click="false">
              <template #activator="{ on, attrs }">
                <v-btn
                  :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                  class="px-0 pb-1 headline text-decoration-underline text--secondary"
                  text
                  v-bind="attrs"
                  v-on="on"
                >
                  {{ eventTypeFormat }}</v-btn
                ></template
              ><v-card
                ><v-autocomplete
                  v-if="
                    chosenEventType === 'flow' ||
                      (hookDetails && hookDetails.flowName)
                  "
                  v-model="flowEventType"
                  item-text="name"
                  item-value="enum"
                  class="pa-4"
                  label="What does it do?"
                  :items="flowEventTypes"
                  >{{ flowEventType.name }}</v-autocomplete
                ></v-card
              ></v-menu
            >
            <span v-if="isSLA">
              for
              <v-menu :close-on-content-click="false">
                <template #activator="{ on, attrs }">
                  <v-btn
                    :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                    class="px-0 pb-1 headline text-decoration-underline text--secondary"
                    text
                    v-bind="attrs"
                    v-on="on"
                  >
                    {{ seconds }}</v-btn
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
            ></span
          >
          <span v-if="includeTo">
            to
            <v-menu :close-on-content-click="false">
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
                    label="Which states?"
                    :items="['Failed', 'Success']"
                    >{{ hookStates }}</v-autocomplete
                  >
                </v-card-actions>
              </v-card>
            </v-menu></span
          >, then
          <v-menu :close-on-content-click="false">
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
            <v-card v-if="!addAction"
              ><v-card-actions>
                <v-autocomplete
                  v-model="chosenAction"
                  multiple
                  label="What should happen?"
                  :items="editedActions"
                  item-text="name"
                  item-value="id"
                  >{{ chosenAction }}</v-autocomplete
                >
                <v-btn
                  small
                  class="ml-8"
                  color="primary"
                  @click="addAction = true"
                  ><v-icon small class="mr-2">fal fa-plus-hexagon</v-icon> New
                </v-btn>
              </v-card-actions>
            </v-card>
            <AddDoThis v-else @close-action="addAction = false"/></v-menu
          >.</v-col
        >
      </v-row></v-card
    >
    <!-- <v-item-group>
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
    </v-item-group> -->
    <v-card-actions class="pa-8">
      <v-spacer /><v-btn
        large
        class="mx-12"
        color="primary"
        :disabled="!completeAction"
        @click="createHook"
        ><v-icon class="pr-2">far fa-file-plus</v-icon>Save Action</v-btn
      >
    </v-card-actions>
  </v-card>
</template>
