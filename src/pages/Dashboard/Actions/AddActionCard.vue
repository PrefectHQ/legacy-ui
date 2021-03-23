<script>
import { mapActions, mapGetters } from 'vuex'
import AddDoThis from '@/pages/Dashboard/Actions/AddDoThis'
import { ACTIONSTATES } from '@/utils/cloudHooks'
import ConfirmDialog from '@/components/ConfirmDialog'

export default {
  components: {
    AddDoThis,
    ConfirmDialog
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
      selectAll: false,
      deleting: false,
      saving: false,
      searchEntry: null,
      selectedFlows: this.hookDetail?.flowName || [],
      step: 'openAgentOrFlow',
      removeDoThisDialog: false,
      flowNamesList: this.hookDetail?.flowNameList || [],
      hookDetails: this.hookDetail,
      project: null,
      stateGroups: Object.keys(ACTIONSTATES),
      states: ACTIONSTATES,
      stateName: '',
      agentFlowOrSomethingElse: '',
      chosenStates:
        this.hookDetail?.hook?.event_tags?.state || ACTIONSTATES['All'],
      disableClick: false,
      chosenAction: this.hookDetail?.hook?.action || null,
      seconds: this.hookDetails?.flowConfig?.duration_seconds || 60,
      addAction: false,
      flowEventType: null,
      notAll: !!this.hookDetail?.flowName || false,
      flowEventTypes: [
        { name: 'does not finish', enum: 'STARTED_NOT_FINISHED' },
        {
          name: 'does not start',
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
    //We can not update an agent for now - config id needs to be added at agent creation
    // ...mapGetters('agent', ['agents']),
    // projectsList() {
    //   return [...this.projects, { name: 'All', id: null }].sort((a, b) =>
    //     a.name > b.name ? 1 : -1
    //   )
    // },
    allFlows() {
      return this.selectedFlows?.length === this.flows?.length
    },
    formHeight() {
      return this.$vuetuify?.breakpoint?.smAndUp ? '30vh' : '20vh'
    },
    agentOrFlow() {
      if (this.agentFlowOrSomethingElse) return this.agentFlowOrSomethingElse
      if (this.hookDetails?.hook?.event_type === 'AgentSLAFailedEvent')
        return 'agent'
      return 'flow'
    },
    disableStep() {
      return this.agentOrFlow === 'agent' || this.selectedFlows.length > 1
    },
    isSLA() {
      return (
        this.flowEventType?.enum === 'STARTED_NOT_FINISHED' ||
        this.flowEventType?.enum === 'SCHEDULED_NOT_STARTED'
      )
    },
    haveOrHas() {
      if (this.selectedFlows?.length > 1 && !this.allFlows) return 'have'
      return 'has'
    },
    editedActions() {
      return this.actions
        ? this.actions.find(
            action => action.action_type === 'CancelFlowRunAction'
          ) || this.agentOrFlow === 'agent'
          ? this.actions
          : [...this.actions, { name: 'cancel that run', value: 'CANCEL_RUN' }]
        : [{ name: 'cancel that run', value: 'CANCEL_RUN' }]
    },
    includeTo() {
      return this.flowEventType?.enum == 'CHANGES_STATE'
    },
    durationSeconds() {
      return this.seconds || this.hookDetails?.flowConfig?.duration_seconds
    },
    flowNames() {
      const agentName =
        this.hookDetail?.agentConfig?.agents?.length == 1
          ? this.HookDetail?.agentConfig?.agents[0]?.name === 'agent'
            ? this.HookDetail?.agentConfig?.agents[0]?.type
            : this.hookDetail?.agentConfig?.agents[0]?.name
          : this.hookDetail?.agentConfig?.agents
              .map((agent, index) => {
                if (index === 0) {
                  return agent.name === 'agent' ? agent.type : agent.name
                } else {
                  return agent.name === 'agent'
                    ? `or ${agent.type}`
                    : `or ${agent.name}`
                }
              })
              .toString()
      return this.agentOrFlow === 'agent'
        ? agentName || 'an agent'
        : this.flowNamesList?.length > 1
        ? this.flowNamesList?.length === this.flows.length
          ? 'any flow'
          : 'mulitiple flows'
        : this.flowNamesList.toString() || this.agentOrFlow
    },
    hookStates() {
      return this.chosenStates.length === this.states['All'].length
        ? 'any state'
        : this.stateName && this.stateName != 'Custom'
        ? this.stateName
        : this.chosenStates.length != 1
        ? 'selected states'
        : this.chosenStates.toString().toLowerCase()
    },
    hookAction() {
      return (
        this.chosenAction?.name || this.chosenAction?.action_type || 'do this'
      )
    },
    completeAction() {
      if (this.agentOrFlow === 'agent') return !!this.chosenAction
      if (!this.includeTo)
        return !!this.selectedFlows?.length && !!this.chosenAction
      return (
        !!this.chosenAction &&
        !!this.chosenStates?.length &&
        !!this.selectedFlows?.length
      )
    },
    placeholderMessage() {
      return 'Search by Flow, or Project'
    },
    searchFormatted() {
      if (!this.searchEntry) return null
      return `%${this.searchEntry}%`
    },
    validUUID() {
      if (!this.searchEntry) return false

      const UUIDRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/

      // Call .trim() to get rid of whitespace on the ends of the
      // string before making the query
      return UUIDRegex.test(this.searchEntry.trim())
    },
    filteredFlowEventTypes() {
      if (this.selectedFlows?.length > 1)
        return this.flowEventTypes.filter(item => item.enum != 'CHANGES_STATE')
      return this.flowEventTypes
    }
  },
  watch: {
    selectAll(val) {
      this.notAll = false
      if (val) {
        this.selectedFlows = this.flows
        this.flowNamesList = ['any flow']

        this.flowEventType = {
          name: 'changes state',
          enum: 'CHANGES_STATE'
        }
      } else {
        this.selectedFlows = []
        this.flowNamesList = []
      }
    }
  },
  created() {
    this.flowEventType = this.hookDetail?.flowConfig?.kind
      ? this.flowEventTypes.find(
          type => type.enum === this.hookDetail?.flowConfig?.kind
        )
      : this.hookDetail?.hook?.event_type === 'FlowRunStateChangedEvent'
      ? {
          name: 'changes state',
          enum: 'CHANGES_STATE'
        }
      : this.hookDetail?.agentConfig
      ? { name: 'is unhealthy' }
      : {
          name: 'does this'
        }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    closeCard() {
      if (this.hookDetail) this.$emit('close')
      else {
        this.$emit('refresh')
      }
    },
    switchStep(step) {
      //steps = 'openAgentOrFlow', 'selectEventType', 'selectFlow', 'selectState', 'openDuration', 'selectDoThis'
      this.step = step
    },
    selectAgentOrFlow(choice) {
      this.agentFlowOrSomethingElse = choice
      if (choice === 'flow') {
        this.flowEventType = this.hookDetail?.flowConfig?.kind
          ? this.flowEventTypes.find(
              type => type.enum === this.hookDetail?.flowConfig?.kind
            )
          : this.hookDetail?.hook?.event_type === 'FlowRunStateChangedEvent'
          ? {
              name: 'changes state',
              enum: 'CHANGES_STATE'
            }
          : {
              name: 'does this'
            }
        this.switchStep('selectFlow')
      }
      if (choice === 'agent') {
        this.flowEventType = { name: 'is unhealthy' }
        this.flowNamesList = []
        this.selectedFlows = []
        this.switchStep('selectDoThis')
      }
    },
    selectFlow(flow) {
      if (
        flow &&
        this.selectedFlows?.find(
          item => item.flow_group_id === flow.flow_group_id
        )
      ) {
        this.selectedFlows = this.selectedFlows?.filter(
          item => item.flow_group_id != flow.flow_group_id
        )
      } else {
        if (flow) this.selectedFlows.push(flow)
      }
      this.notAll = true
      this.flowNamesList = this.selectedFlows?.map(flow => flow.name)
    },
    handleFlowNext() {
      if (this.selectedFlows?.length > 1) {
        this.flowEventType = {
          name: 'changes state',
          enum: 'CHANGES_STATE'
        }
        this.switchStep('selectState')
      } else {
        this.switchStep('selectEventType')
      }
    },
    selectFlowEventType(type) {
      this.flowEventType = type
      this.isSLA
        ? this.switchStep('openDuration')
        : this.includeTo
        ? this.switchStep('selectState')
        : this.switchStep('selectDoThis')
    },
    selectStateGroup(group) {
      this.stateName = group
      this.chosenStates = this.states[group]
    },
    selectStates(state) {
      this.stateName = 'Custom'
      this.chosenStates.find(
        item => item === state || item.toUpperCase() == state
      )
        ? (this.chosenStates = this.chosenStates.filter(
            item => item != state && item.toUpperCase() != state
          ))
        : this.chosenStates.push(state)
    },
    selectAction(action) {
      this.chosenAction = action
    },
    closeStates() {
      this.switchStep('selectDoThis')
    },
    closeSeconds() {
      this.switchStep('selectDoThis')
    },
    addNewAction() {
      this.addAction = true
      // this.openActions = false
    },
    disableChip(item) {
      return (
        (item.enum != 'CHANGES_STATE' && this.selectedFlows?.length > 1) ||
        this.agentOrFlow === 'agent'
      )
    },
    includesFlow(flow) {
      return (
        this.selectedFlows.filter(
          item => item.flow_group_id === flow.flow_group_id
        )?.length > 0
      )
    },
    async createAction(input) {
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create_action.gql'),
          variables: {
            input: { config: input.config, name: input.name }
          }
        })
        await this.$apollo.queries.actions.refetch()
        this.addAction = false
        this.step = 'selectDoThis'
        const newAction = {
          id: data.create_action.id,
          name: input.name
        }
        this.selectAction(newAction)
        return data?.create_action
      } catch (error) {
        const errString = `${error}`
        this.setAlert({
          alertShow: true,
          alertMessage: errString,
          alertType: 'error'
        })
      }
    },
    handleRemoveClick(toDo) {
      this.removeToDoId = toDo.id
      this.removeDoThisDialog = true
    },
    async removeDoThis() {
      this.deleting = true
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/delete_action.gql'),
          variables: {
            id: this.removeToDoId
          }
        })
        data.delete_action?.success
          ? await this.$apollo.queries.actions.refresh()
          : this.setAlert({
              alertShow: true,
              alertMessage: data.delete_action.error,
              alertType: 'error'
            })
      } catch (error) {
        const errString = `${error}`
        this.setAlert({
          alertShow: true,
          alertMessage: errString,
          alertType: 'error'
        })
      } finally {
        this.removeDoThisDialog = false
        this.deleting = false
      }
    },
    async createHook() {
      this.saving = true
      let data
      try {
        const flow = this.selectedFlows[0]?.flow_group_id
        let action = this.chosenAction || this.hookDetails?.hook?.action
        if (action?.value === 'CANCEL_RUN') {
          const cancelConfig = { cancel_flow_run: {} }
          action = await this.createAction({
            config: cancelConfig,
            name: 'cancel that run'
          })
        }
        if (flow) {
          if (this.includeTo) {
            const flowGroupIds = this.selectedFlows?.map(
              flow => flow.flow_group_id
            )
            const flowRunStateChangedSuccess = await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/create_flow_run_state_changed_hook.gql'),
              variables: {
                input: {
                  flow_group_ids: this.allFlows ? [] : flowGroupIds,
                  action_id: action.id,
                  states: this.chosenStates
                }
              }
            })
            data = flowRunStateChangedSuccess.data
          }
          if (this.isSLA) {
            const kind = this.flowEventType?.enum
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
                  action_id: action.id,
                  sla_config_ids: [configId.data.create_flow_sla_config.id]
                }
              }
            })
            data = flowSLAEventSuccess.data
          }
        } else if (this.agentOrFlow === 'agent') {
          let agentConfig
          if (this.hookDetails?.agentConfig) {
            agentConfig = this.hookDetails?.agentConfig
          } else {
            const { data } = await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/create_agent_config.gql'),
              variables: {
                input: {}
              }
            })
            agentConfig = data?.create_agent_config
          }
          const agentHook = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/create_agent_sla_failed_hook.gql'),
            variables: {
              input: {
                action_id: action.id,
                agent_config_ids: [agentConfig.id]
              }
            }
          })
          data = agentHook.data
        }
        if (data && this.hookDetails) {
          await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/delete-hook.gql'),
            variables: {
              hookId: this.hookDetails.hook.id
            }
          })
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
        this.$emit('refetch-hooks')
        if (data) {
          this.setAlert({
            alertShow: true,
            alertMessage: 'Hook created',
            alertType: 'success'
          })
          this.saving = false
          this.closeCard()
        }
      }
    }
  },
  apollo: {
    flows: {
      query() {
        return require('@/graphql/Dashboard/flows.js').default(this.isCloud)
      },
      variables() {
        let searchParams = [{ archived: { _eq: false } }]

        let orParams = [
          {
            name: { _ilike: this.searchFormatted }
          },
          { project: { name: { _ilike: this.searchFormatted } } }
        ]

        if (this.validUUID) {
          orParams.push({ id: { _eq: this.search } })
        }

        if (this.isCloud) {
          orParams.push({
            created_by: { username: { _ilike: this.searchFormatted } }
          })
        }

        return {
          searchParams: {
            _and: [...searchParams, { _or: [...orParams] }]
          }
        }
      },
      loadingKey: 'loading',
      pollInterval: 60000,
      update: data => {
        return data?.flow
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
  <v-card v-if="!addAction" outlined>
    <v-card-title>
      <v-spacer></v-spacer>
      <v-btn
        v-if="step != 'openAgentOrFlow' || hookDetail"
        text
        color="utilGreyDark"
        class="light-weight-text mr-1"
        @click="closeCard"
      >
        <v-icon small>close</v-icon
        ><span style="text-transform: none;">Cancel</span></v-btn
      ><v-btn
        color="primary"
        elevation="0"
        :loading="saving"
        :disabled="!completeAction"
        @click="createHook"
        ><i class="far fa-cloud-upload-alt fa-lg"></i>
        <span class="pl-2">Save</span></v-btn
      ></v-card-title
    >

    <v-card-text class="headline" elevation="0">
      When
      <v-btn
        :style="{ 'text-transform': 'none', 'min-width': '0px' }"
        :color="
          step === 'openAgentOrFlow' || step === 'selectFlow'
            ? 'codePink'
            : 'grey'
        "
        class="px-0 pb-1 headline d-inline-block text-truncate"
        text
        max-width="500px"
        @click="step = 'openAgentOrFlow'"
        ><truncate
          v-if="flowNamesList && flowNamesList.length"
          :content="flowNamesList.toString()"
          >{{ flowNames }}</truncate
        ><span v-else>{{ flowNames }}</span></v-btn
      >
      <span
        >{{ ' '
        }}<span v-if="agentOrFlow === 'flow'">{{ haveOrHas }} a run that </span>

        <v-btn
          v-if="!disableStep"
          :style="{ 'text-transform': 'none', 'min-width': '0px' }"
          class="px-0 pb-1 headline"
          text
          :color="step === 'selectEventType' ? 'codePink' : 'grey'"
          @click="switchStep('selectEventType')"
        >
          {{ flowEventType.name }}</v-btn
        ><span v-else>{{ flowEventType.name }}</span>
        <span v-if="isSLA">
          for

          <v-btn
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            class="px-0 pb-1 headline"
            text
            :color="step === 'openDuration' ? 'codePink' : 'grey'"
            @click="switchStep('openDuration')"
          >
            {{ seconds }}</v-btn
          >
          seconds</span
        ></span
      ><span v-if="includeTo">
        to
        <v-btn
          :style="{ 'text-transform': 'none', 'min-width': '0px' }"
          class=" px-0 pb-1 headline"
          text
          :color="step === 'selectState' ? 'codePink' : 'grey'"
          @click="switchStep('selectState')"
        >
          {{ hookStates }}</v-btn
        ></span
      >, then

      <v-btn
        :style="{
          'text-transform': 'none',
          'min-width': '0px'
        }"
        class="px-0 pb-1 headline d-inline-block text-truncate"
        text
        :color="step === 'selectDoThis' ? 'codePink' : 'grey'"
        @click="switchStep('selectDoThis')"
        >{{ hookAction }}</v-btn
      >.
    </v-card-text>
    <v-card-text v-if="step === 'openAgentOrFlow'">
      <v-row>
        <v-col
          v-for="item in ['flow', 'agent']"
          :key="item"
          cols="6"
          sm="2"
          class="pa-2"
        >
          <div
            v-ripple
            class="chip-small d-flex align-center justify-start pa-2 cursor-pointer subtitle-1"
            :class="{ active: agentOrFlow === item }"
            @click="selectAgentOrFlow(item)"
            ><div class="text-center"
              ><v-icon class="pr-2">{{
                item === 'flow' ? 'pi-flow' : 'pi-agent'
              }}</v-icon
              >{{ item }}</div
            ></div
          >
        </v-col>
      </v-row>
    </v-card-text>
    <v-sheet v-else-if="step === 'selectFlow'" class="pa-4">
      <v-row
        ><v-col cols="3">
          <!-- //need to fix v-model AND flow box color/style -->
          <v-checkbox
            v-if="!searchEntry"
            v-model="selectAll"
            class="mx-2 mt-2"
            dense
            label="Select All"
            :indeterminate="notAll"
          ></v-checkbox> </v-col
        ><v-col cols="9">
          <v-text-field
            v-model="searchEntry"
            hide-details
            single-line
            solo
            flat
            :placeholder="placeholderMessage"
            prepend-inner-icon="search"
            autocomplete="new-password"
        /></v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-sheet
            :height="formHeight"
            :style="{ 'overflow-y': 'auto', 'overflow-x': 'hidden' }"
          >
            <v-row class="py-2">
              <v-col
                v-for="item in flows"
                :key="item.id"
                cols="6"
                sm="3"
                lg="2"
              >
                <div
                  v-ripple
                  class="chip-bigger d-flex align-center justify-start pa-2 cursor-pointer user-select-none"
                  :class="{ active: includesFlow(item) }"
                  @click="selectFlow(item)"
                >
                  <truncate :content="`${item.name} - ${item.project.name}`"
                    ><div class="caption">{{ item.project.name }}</div
                    ><div class="subtitle-1">{{ item.name }}</div></truncate
                  >
                </div></v-col
              >
            </v-row>
          </v-sheet>
        </v-col>
      </v-row>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          elevation="0"
          :disabled="!selectedFlows.length"
          title="Next"
          class="mx-1"
          @click="handleFlowNext"
        >
          Next
          <v-icon small>call_made</v-icon>
        </v-btn>
      </v-card-actions>
    </v-sheet>

    <v-card-text v-else-if="step === 'selectEventType'"
      ><v-row class="py-2">
        <v-col
          v-for="item in filteredFlowEventTypes"
          :key="item.enum"
          cols="6"
          sm="2"
        >
          <div
            v-ripple
            class="chip-small d-flex align-center justify-start pa-2 cursor-pointer user-select-none"
            :class="{ active: includesFlow(item) }"
            @click="selectFlowEventType(item)"
            ><div class="text-center subtitle-1">{{ item.name }}</div>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
    <div v-else-if="step === 'openDuration'">
      <v-card-text>
        <v-text-field
          v-model="seconds"
          type="number"
          persistent-hint
          hint="Hint: confirm duration by pressing the Enter key"
          @keydown.enter="closeSeconds"
          @blur="closeSeconds"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          elevation="0"
          title="Next"
          class="mx-1"
          @click="closeSeconds"
        >
          Next
          <v-icon small>call_made</v-icon>
        </v-btn></v-card-actions
      ></div
    >

    <v-card-text v-else-if="step === 'selectState'">
      <v-chip
        v-for="item in stateGroups"
        :key="item.id"
        color="primary"
        label
        max-width="300px"
        :title="
          item == 'All'
            ? `Select all states`
            : `Select ${item} and all connected states`
        "
        class="ma-1"
        @click="selectStateGroup(item)"
        >{{ item }}</v-chip
      >

      <v-divider class="ma-2" />
      <v-row class="py-2">
        <v-col
          v-for="item in states['All']"
          :key="item"
          cols="4"
          sm="3"
          class="pa-2"
        >
          <div
            v-ripple
            class="chip-small d-flex align-center justify-start pa-2 cursor-pointer subtitle-1"
            :class="{ active: chosenStates.includes(item) }"
            @click="selectStates(item)"
          >
            {{ item }}
          </div>
        </v-col>
      </v-row>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          elevation="0"
          title="Next"
          class="mx-1"
          :disabled="chosenStates.length < 1"
          @click="switchStep('selectDoThis')"
        >
          Next
          <v-icon small>call_made</v-icon>
        </v-btn></v-card-actions
      ></v-card-text
    >

    <v-card-text v-else-if="step === 'selectDoThis'">
      <v-row class="px-3">
        <v-btn small elevation="0" color="primary" @click="addNewAction"
          ><v-icon small class="mr-2">fal fa-plus-hexagon</v-icon> New
        </v-btn>
      </v-row>

      <v-row class="py-2 px-1">
        <v-col v-if="!editedActions.length"
          >Click on new to configure new notifications.</v-col
        >
        <v-col
          v-for="item in editedActions"
          v-else
          :key="item.id"
          cols="6"
          sm="3"
          class="pa-2"
        >
          <div
            v-ripple
            class="chip-small d-flex align-center justify-start pa-2 cursor-pointer subtitle-1"
            :class="{ active: chosenAction === item }"
            :disabled="
              item.action_type === 'CancelFlowRunAction' &&
                agentOrFlow === 'agent'
            "
            @click="selectAction(item)"
            >{{ item.name }}<v-spacer></v-spacer>
            <v-btn
              small
              icon
              title="Remove"
              color="codePink"
              @click.stop="handleRemoveClick(item)"
            >
              <i class="fas fa-times-circle fa-lg"/></v-btn
          ></div>
        </v-col>
      </v-row>
      <ConfirmDialog
        :value="removeDoThisDialog"
        :loading="deleting"
        width="30vW"
        title="Are
      you sure you want to delete this?"
        type="error"
        @cancel="removeDoThisDialog = false"
        @confirm="removeDoThis"
        ><slot
          ><span class="red--text"
            >This will also delete any associated Actions.</span
          ></slot
        ></ConfirmDialog
      >
    </v-card-text>
  </v-card>
  <AddDoThis
    v-else
    :event-type="flowEventType.enum || 'AGENT'"
    @close-action="addAction = false"
    @new-action="createAction"
  />
</template>

<style lang="scss" scoped>
.chip-bigger {
  border: 1px solid;
  border-color: var(--v-utilGrayLight-base) !important;
  border-radius: 5px;
  height: 60px;
  transition: all 50ms;
  width: 100%;

  &.active {
    border-color: var(--v-codePink-base) !important;
  }

  &:hover,
  &:focus {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.chip-small {
  border: 1px solid;
  border-color: var(--v-utilGrayLight-base) !important;
  border-radius: 5px;
  height: 35px;
  transition: all 50ms;
  width: 100%;

  &.active {
    border-color: var(--v-codePink-base) !important;
  }

  &:hover,
  &:focus {
    background-color: rgba(0, 0, 0, 0.05);
  }
}
</style>
