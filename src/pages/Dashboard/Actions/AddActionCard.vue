<script>
import { mapActions, mapGetters } from 'vuex'
import AddDoThis from '@/pages/Dashboard/Actions/AddDoThis'
import { STATES } from '@/utils/cloudHooks'

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
      selectedFlows: [],
      openSeconds: false,
      openSelectFlowEventType: false,
      openFlow: false,
      openStates: false,
      openAgentOrFlow: true,
      openActions: false,
      flowNamesList: [],
      hookDetails: this.hookDetail,
      project: '',
      flowEventType: this.hookDetails?.hook?.event_type || {
        name: 'does this'
      },
      stateGroups: Object.keys(STATES),
      states: STATES,
      selectedStateGroup: null,
      agentFlowOrSomethingElse: '',
      chosenStates: this.hookDetails?.hook?.event_tags?.state || [],
      chosenAction: this.hookDetails?.hook?.action || [],
      seconds: this.hookDetails?.flowConfig?.duration_seconds || 60,
      addAction: false,
      flowEventTypes: [
        { name: 'starts but does not finish', enum: 'STARTED_NOT_FINISHED' },
        {
          name: 'does not start at the scheduled start time',
          enum: 'SCHEDULED_NOT_STARTED'
        },
        {
          name: 'changes state',
          enum: 'CHANGES_STATE'
        }
      ]
    }
  },
  computed: {
    ...mapGetters('data', ['projects']),
    agentOrFlow() {
      if (this.hookDetails?.flowName) return 'flow'
      if (!this.agentFlowOrSomethingElse) return 'flow'
      return this.agentFlowOrSomethingElse
    },
    isSLA() {
      return (
        this.flowEventType?.enum === 'STARTED_NOT_FINISHED' ||
        this.flowEventType?.enum === 'SCHEDULED_NOT_STARTED'
      )
    },
    editedActions() {
      return this.actions
        ? this.actions.find(action => action.action_type === 'CancelFlowRun')
          ? this.actions
          : [...this.actions, { name: 'cancel that run', value: 'CANCEL_RUN' }]
        : [{ name: 'cancel that run', value: 'CANCEL_RUN' }]
    },
    includeTo() {
      return this.flowEventType.enum == 'CHANGES_STATE'
    },
    durationSeconds() {
      return this.seconds || this.hookDetails?.flowConfig?.duration_seconds
    },
    flowNames() {
      return this.flowNamesList?.toString() || this.agentOrFlow
    },
    hookStates() {
      return this.chosenStates?.toString().toLowerCase() || 'state'
    },
    hookAction() {
      return (
        this.chosenAction.name || this.chosenAction.action_type || 'do this'
      )
    },
    completeAction() {
      if (this.hookDetail) return true
      if (!this.includeTo)
        return !!this.agentFlowOrSomethingElse && !!this.chosenAction
      return (
        !!this.chosenAction &&
        !!this.chosenStates.length &&
        !!this.agentFlowOrSomethingElse
      )
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    closeCard() {
      this.$emit('close')
    },
    selectAgentorFlow(choice) {
      this.agentFlowOrSomethingElse = choice
      this.openAgentOrFlow = false
      if (choice === 'flow') this.openFlow = true
      if (choice === 'agent') {
        this.openAgent = true
        this.flow = {}
        this.openSelectFlowEventType = false
      }
    },
    selectFlow(event, flow) {
      this.selectedFlows.push(flow)
      this.flowNamesList.push(flow.name)
      if (!event.shiftKey) {
        this.openFlow = false
        this.openSelectFlowEventType = true
      }
    },
    selectAllFlows() {
      this.selectedFlows = this.flows
      this.flowNamesList.push('any flow')
      this.openFlow = false
      this.openSelectFlowEventType = true
    },
    selectFlowEventType(type) {
      this.flowEventType = type
      this.openSelectFlowEventType = false
      this.isSLA
        ? (this.openSeconds = true)
        : this.includeTo
        ? (this.openStates = true)
        : ''
    },
    selectStateGroup(group) {
      this.selectedStateGroup = STATES[group]
    },
    selectStates(state) {
      this.chosenStates.find(item => item === state)
        ? (this.chosenStates = this.chosenStates.filter(item => item != state))
        : this.chosenStates.push(state)
    },
    selectAction(action) {
      this.chosenAction = action
      this.openActions = false
    },
    closeStates() {
      this.openStates = false
    },
    addNewAction() {
      this.addAction = true
      this.openActions = false
    },
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
      const flow =
        this.selectedFlows[0] || this.hookDetails?.flowName[0]?.flow_group_id
      const action = this.chosenAction[0] || this.hookDetails?.hook?.action?.id
      if (action === 'CANCEL_RUN') {
        this.createAction(true)
      }
      try {
        if (
          this.agentFlowOrSomethingElse === 'flow' ||
          this.hookDetails?.flowName[0]
        ) {
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
          project: this.project || null
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

    <v-card class="px-8" elevation="0">
      <v-row
        ><v-col cols="12" class="headline black--text">
          When
          <v-btn
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            :color="openAgentOrFlow || openFlow ? 'codePink' : 'grey'"
            class="px-0 pb-1 headline"
            text
            @click="openAgentOrFlow = !openAgentOrFlow"
            >{{ flowNames }}</v-btn
          >
          <span
            >{{ ' ' }}<span v-if="agentOrFlow === 'flow'">has a run that </span>

            <v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              class="px-0 pb-1 headline"
              text
              :color="openSelectFlowEventType ? 'codePink' : 'grey'"
              @click="openSelectFlowEventType = !openSelectFlowEventType"
            >
              {{ flowEventType.name }}</v-btn
            >
            <span v-if="isSLA">
              for

              <v-btn
                :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                class="px-0 pb-1 headline text-decoration-underliney"
                text
                :color="openSeconds ? 'codePink' : 'grey'"
                @click="openSeconds = !openSeconds"
              >
                {{ seconds }}</v-btn
              >
              seconds</span
            ></span
          >
          <span v-if="includeTo">
            to
            <v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              class=" px-0 pb-1 headline"
              text
              :color="openStates ? 'codePink' : 'grey'"
              @click="openStates = !openStates"
            >
              {{ hookStates }}</v-btn
            > </span
          >, then

          <v-btn
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            class="px-0 pb-1 headline"
            text
            :color="openActions ? 'codePink' : 'grey'"
            @click="openActions = !openActions"
            >{{ hookAction }}</v-btn
          >

          .</v-col
        >
      </v-row></v-card
    >
    <v-card v-if="openAgentOrFlow" elevation="0" class="pl-8">
      <v-chip
        v-for="item in ['flow', 'agent']"
        :key="item"
        label
        class="mx-2"
        outlined
        @click="selectAgentorFlow(item)"
        ><v-icon class="pr-2">{{
          item === 'flow' ? 'pi-flow' : 'pi-agent'
        }}</v-icon
        >{{ item }}</v-chip
      >
    </v-card>
    <v-card v-else-if="openFlow" elevation="0" :style="{ overflow: 'auto' }">
      <v-card-title
        ><v-btn color="primary" @click="selectAllFlows">Select All Flows</v-btn
        ><v-autocomplete
          v-model="project"
          width="100px"
          class="px-2"
          :items="projects"
          item-text="name"
          item-value="id"
          label="Filter by Project"
        ></v-autocomplete
        >Hold "shift" to choose multiple flows
      </v-card-title>
      <v-chip
        v-for="item in flows"
        :key="item.id"
        label
        :color="selectedFlows.includes(item) ? 'pink' : ''"
        class="mx-2"
        outlined
        @click="selectFlow($event, item)"
        >{{ item.name
        }}<span class="font-weight-light">
          ({{ item.project.name }})</span
        ></v-chip
      >
    </v-card>
    <v-card
      v-else-if="openSelectFlowEventType"
      elevation="0"
      class="text-center"
      ><v-chip
        v-for="item in flowEventTypes"
        :key="item.enum"
        label
        class="mx-2"
        outlined
        @click="selectFlowEventType(item)"
        >{{ item.name }}</v-chip
      ></v-card
    >
    <v-card v-else-if="openSeconds" elevation="0"
      ><v-card-text>
        <v-text-field
          v-model="seconds"
          min-width="50px"
          type="number"
          @keydown.enter="openSeconds = false"
          @blur="openSeconds = false"
        ></v-text-field>
      </v-card-text>
    </v-card>
    <v-card v-else-if="openStates && !selectedStateGroup" elevation="0">
      <v-chip
        v-for="item in stateGroups"
        :key="item.id"
        label
        class="mx-2"
        outlined
        @click="selectStateGroup(item)"
        >{{ item }}</v-chip
      >
    </v-card>
    <v-card v-else-if="openStates" v-click-outside="closeStates" elevation="0">
      <v-chip
        v-for="item in selectedStateGroup"
        :key="item.id"
        label
        class="mx-2"
        outlined
        @click="selectStates(item)"
        >{{ item }}</v-chip
      >
    </v-card>
    <v-card v-else-if="openActions" elevation="0"
      ><v-card-actions>
        <v-chip
          v-for="item in editedActions"
          :key="item.id"
          label
          class="mx-2"
          outlined
          @click="selectAction(item)"
          >{{ item.name || item.action_type }}</v-chip
        >
        <v-btn small class="ml-8" color="primary" @click="addNewAction"
          ><v-icon small class="mr-2">fal fa-plus-hexagon</v-icon> New
        </v-btn>
      </v-card-actions>
    </v-card>
    <AddDoThis v-else-if="addAction" @close-action="addAction = false" />
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
