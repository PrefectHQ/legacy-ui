<script>
import { mapActions, mapGetters } from 'vuex'
import AddAction from '@/pages/Dashboard/Automations/AddAction'
import CreateAgentConfigForm from '@/pages/Dashboard/Automations/CreateAgentConfigForm'
import {
  AUTOMATIONSTATES,
  flowEventTypes,
  actionTypes
} from '@/utils/automations'
import ConfirmDialog from '@/components/ConfirmDialog'
import UpgradeBadge from '@/components/UpgradeBadge'

const systemActions = ['CancelFlowRunAction', 'PauseScheduleAction']

export default {
  components: {
    AddAction,
    CreateAgentConfigForm,
    ConfirmDialog,
    UpgradeBadge
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
      steps: {
        openAgentOrFlow: { name: 'openAgentOrFlow', complete: false },
        chooseAgentConfig: { name: 'chooseAgentConfig', complete: false },
        selectFlow: { name: 'selectFlow', complete: false },
        selectEventType: { name: 'selectEventType', complete: false },
        selectState: { name: 'selectState', complete: false },
        openDuration: { name: 'openDuration', complete: false },
        selectDoThis: { name: 'selectDoThis', complete: false }
      },
      hookTypes: [
        { type: 'flow', label: 'flow run', permission: null },
        { type: 'agent', label: 'agent', permission: 'feature:agent-sla' }
      ],
      selectAll: false,
      deleting: false,
      saving: false,
      searchEntry: null,
      selectedAgentConfig: this.hookDetail?.agentConfig,
      selectedFlows: this.hookDetail?.flowName || [],
      showAgentConfigForm: false,
      step: null,
      removeDoThisDialog: false,
      flowNamesList: this.hookDetail?.flowNameList || [],
      hookDetails: this.hookDetail,
      project: null,
      stateGroups: Object.keys(AUTOMATIONSTATES),
      states: AUTOMATIONSTATES,
      stateName: '',
      agentFlowOrSomethingElse: null,
      chosenStates:
        this.hookDetail?.hook?.event_tags?.state || AUTOMATIONSTATES['All'],
      disableClick: false,
      chosenAction: this.hookDetail?.hook?.action || null,
      seconds: this.hookDetails?.flowConfig?.duration_seconds || 60,
      addAction: false,
      flowEventType: null,
      flowEventTypes: flowEventTypes,
      notAll: !!this.hookDetail?.flowName || false,
      previousStep: null,
      isActive: false,
      rules: {
        required: val => !!val || 'Required',
        notNull: val => val > 0 || 'Duration must be greater than 0 seconds'
      },
      animated: false,
      agentConfigId: ''
    }
  },
  computed: {
    ...mapGetters('data', ['projects']),
    ...mapGetters('license', ['permissions']),
    //We can not update agent for now - config id needs to be added at agent creation
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
      return this.$vuetuify?.breakpoint?.smAndUp ? '35vh' : '25vh'
    },
    agentOrFlow() {
      if (this.agentFlowOrSomethingElse) return this.agentFlowOrSomethingElse
      if (this.hookDetails?.hook?.event_type === 'AgentSLAFailedEvent')
        return 'agent'
      if (this.hookDetails) return 'flow'
      return 'this'
    },
    disableStep() {
      return this.agentOrFlow === 'agent' || this.selectedFlows.length > 1
    },
    disableDoThis() {
      if (this.agentOrFlow === 'this' && !this.hookDetail) return true
      if (this.agentOrFlow === 'flow' && this.selectedFlows.length < 1)
        return true
      return false
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
      // Most actions are independent and can be used across flows but PauseScheduleAction requires an flow group id so need to filter here
      const actions = this.actions.filter(
        action =>
          action.action_type !== 'PauseScheduleAction' ||
          action?.action_config?.flow_group_id ===
            this.selectedFlows[0]?.flow_group_id
      )
      return actions
        ? this.agentOrFlow === 'agent'
          ? actions.filter(
              action =>
                action.action_type !== 'CancelFlowRunAction' &&
                action.action_type !== 'PauseScheduleAction'
            )
          : actions.find(
              action => action.action_type === 'CancelFlowRunAction'
            ) &&
            actions.find(
              action =>
                action.action_type === 'PauseScheduleAction' &&
                action.action_config.flow_group_id ===
                  this.selectedFlows[0].flow_group_id
            )
          ? actions
          : actions.find(action => action.action_type === 'PauseScheduleAction')
          ? [
              ...actions,
              {
                name: 'cancel run',
                value: 'CANCEL_RUN',
                action_type: 'CancelFlowRunAction'
              }
            ]
          : actions.find(action => action.action_type === 'CancelFlowRunAction')
          ? [
              ...actions,
              {
                name: 'pause schedule',
                value: 'PAUSE_SCHEDULE',
                action_type: 'PauseScheduleAction'
              }
            ]
          : [
              ...actions,
              {
                name: 'pause schedule',
                value: 'PAUSE_SCHEDULE',
                action_type: 'PauseScheduleAction'
              },
              {
                name: 'cancel run',
                value: 'CANCEL_RUN',
                action_type: 'CancelFlowRunAction'
              }
            ]
        : [
            {
              name: 'cancel run',
              value: 'CANCEL_RUN',
              id: 1,
              action_type: 'CancelFlowRunAction'
            },
            {
              name: 'pause schedule',
              value: 'PAUSE_SCHEDULE',
              id: 2,
              action_type: 'PauseScheduleAction'
            }
          ]
    },
    customActions() {
      return this.editedActions.filter(
        a => !systemActions.includes(a.action_type)
      )
    },
    systemActions() {
      return this.editedActions.filter(a =>
        systemActions.includes(a.action_type)
      )
    },
    includeTo() {
      this.hookDetail
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
        ? agentName || 'agent'
        : this.flowNamesList?.length > 1
        ? this.flowNamesList?.length === this.flows?.length
          ? 'any flow'
          : 'any of these flows'
        : this.flowNamesList.toString() || this.agentOrFlow
    },
    hookStates() {
      return this.chosenStates?.length === this.states['All'].length
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
    stateGroupAll() {
      return this.stateGroup('All')
    },
    stateGroupCustom() {
      return (
        !this.stateGroupAll &&
        !this.stateGroupFailed &&
        !this.stateGroupFinished &&
        !this.stateGroupSuccess
      )
    },
    stateGroupFailed() {
      return this.stateGroup('Failed')
    },
    stateGroupFinished() {
      return this.stateGroup('Finished')
    },
    stateGroupSuccess() {
      return this.stateGroup('Success')
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
    this.step = this.steps['openAgentOrFlow']
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
      ? { name: 'are unhealthy' }
      : {
          name: 'does this'
        }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    actionIcon(type) {
      return actionTypes.find(a => a.actionType == type)?.icon
    },
    addHint() {
      clearTimeout(this.animationTimeout)
      this.animated = true

      this.animationTimeout = setTimeout(() => {
        this.animated = false
      }, 1500)
    },
    buttonColor(selectedStep, otherStep) {
      // const stepComplete = this.steps[selectedStep]
      // const otherComplete = this.steps[otherStep]
      return this.step.name === selectedStep || this.step.name === otherStep
        ? 'accentPink'
        : 'utilGrayDark'
    },
    createAgentConfig() {},
    format(selectedStep, otherStep) {
      const stepComplete = this.steps[selectedStep].complete
      return this.step.name === selectedStep || this.step.name === otherStep
        ? 'font-weight-dark'
        : stepComplete
        ? 'font-weight-light text-decoration-dotted-underline'
        : 'font-weight-light'
    },
    closeCard() {
      if (this.hookDetail) this.$emit('close')
      else {
        this.$emit('refresh')
      }
    },
    stateGroup(group) {
      return (
        AUTOMATIONSTATES[group] &&
        AUTOMATIONSTATES[group].every(state =>
          this.chosenStates?.includes(state)
        ) &&
        AUTOMATIONSTATES[group].length == this.chosenStates.length
      )
    },
    dynamicStateGroup(group) {
      return this[`stateGroup${group}`]
    },
    switchStep(selectedStep) {
      if (this.step.name == selectedStep) {
        this.addHint()
      } else {
        clearTimeout(this.animationTimeout)
      }

      this.previousStep = this.step.name

      if (this.step.name === 'openDuration')
        this.steps['openDuration'].complete = true
      this.step = this.steps[selectedStep]
    },
    selectAgentOrFlow(choice) {
      this.agentFlowOrSomethingElse = choice
      if (choice === 'flow') {
        this.flowEventType =
          this.hookDetail?.hook?.event_type === 'FlowSLAFailedEvent'
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
        this.flowEventType = { name: 'are unhealthy' }
        this.flowNamesList = []
        this.selectedFlows = []

        this.switchStep('chooseAgentConfig')
      }
      this.steps['openAgentOrFlow'].complete = true
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
      this.steps['openAgentOrFlow'].complete = true
      this.steps['selectFlow'].complete = true
    },
    handleFlowNext() {
      if (this.selectedFlows.length || this.allFlows)
        this.steps['openAgentOrFlow'].complete = true
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
    hasPermission(permission) {
      return permission ? this.permissions?.includes(permission) : true
    },
    selectFlowEventType(type) {
      this.steps['selectEventType'].complete = true
      if (type) this.flowEventType = type
      this.isSLA
        ? this.switchStep('openDuration')
        : this.includeTo
        ? this.switchStep('selectState')
        : this.switchStep('selectDoThis')
    },
    selectStateGroup(group) {
      this.stateName = group
      this.chosenStates = [...this.states[group]]
      this.steps['selectState'].complete = this.chosenStates.length > 0
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
      this.steps['selectState'].complete = this.chosenStates.length > 0
    },
    async handleSaveAgentConfig() {
      this.$apollo.queries.agentConfigs.refetch()
      this.showAgentConfigForm = false
    },
    selectAgentConfig(config) {
      this.steps['chooseAgentConfig'].complete = true
      this.selectedAgentConfig = config
    },
    selectAction(action) {
      this.steps['selectDoThis'].complete = true
      this.chosenAction = action
    },
    closeStates() {
      this.switchStep('selectDoThis')
    },
    closeSeconds() {
      this.steps['openDuration'].complete = true
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
          mutation: require('@/graphql/Mutations/create-action.gql'),
          variables: {
            input: { config: input.config, name: input.name }
          }
        })
        await this.$apollo.queries.actions.refetch()
        this.addAction = false
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
        const name = this.selectedFlows[0]?.name
        let action = this.chosenAction || this.hookDetails?.hook?.action
        if (action?.value === 'CANCEL_RUN') {
          const cancelConfig = { cancel_flow_run: {} }
          action = await this.createAction({
            config: cancelConfig,
            name: 'cancel that run'
          })
        }
        if (action?.value === 'PAUSE_SCHEDULE') {
          const pauseConfig = { pause_schedule: { flow_group_id: flow } }
          action = await this.createAction({
            config: pauseConfig,
            name: `pause ${name}'s schedule`
          })
        }
        if (flow) {
          if (this.includeTo) {
            const flowGroupIds = this.selectedFlows?.map(
              flow => flow.flow_group_id
            )
            const inputObject = this.allFlows
              ? {
                  action_id: action.id,
                  states: this.chosenStates
                }
              : {
                  flow_group_ids: flowGroupIds,
                  action_id: action.id,
                  states: this.chosenStates
                }
            const flowRunStateChangedSuccess = await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/create-flow-run-state-changed-hook.gql'),
              variables: {
                input: inputObject
              }
            })
            data = flowRunStateChangedSuccess.data
          }
          if (this.isSLA) {
            const kind = this.flowEventType?.enum
            const configId = await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/create-flow-sla.gql'),
              variables: {
                input: {
                  kind: kind,
                  duration_seconds: Number(this.durationSeconds)
                }
              }
            })
            await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/add-config-to-flow.gql'),
              variables: {
                input: {
                  flow_sla_config_id: configId.data.create_flow_sla_config.id,
                  flow_group_id: flow
                }
              }
            })

            const flowSLAEventSuccess = await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/create-flow-sla-failed-hook.gql'),
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
              mutation: require('@/graphql/Mutations/create-agent-config.gql'),
              variables: {
                input: {}
              }
            })
            agentConfig = data?.create_agent_config
            this.agentConfigId = agentConfig.id
          }
          const agentHook = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/create-agent-sla-failed-hook.gql'),
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
        this.saving = false
      } finally {
        this.hookDetails = null
        this.$emit('refetch-hooks')
        if (data) {
          const agentConfigString = `Your agent config ID is ${this.agentConfigId}.  You can find this in the info button on your automation`
          this.setAlert({
            alertShow: true,
            alertMessage: this.agentConfigId
              ? agentConfigString
              : 'Automation created',
            alertType: 'success',
            alertCopy: this.agentConfigId
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
      update: data => data?.flow || []
    },
    actions: {
      query: require('@/graphql/Automations/actions.gql'),
      update: data => data?.action
    },
    agentConfigs: {
      query: require('@/graphql/Automations/agent-config.gql'),
      update: data => data.agent_config
    }
  }
}
</script>

<template>
  <v-card class="pb-4 px-4" elevation="4">
    <v-card-text class="text-h5 font-weight-light pb-0 pt-4 px-0">
      <v-row no-gutters>
        <v-col cols="9" lg="10">
          When<v-btn
            v-if="agentOrFlow === 'flow'"
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            :color="buttonColor('openAgentOrFlow')"
            :class="format('openAgentOrFlow')"
            class="px-0 pb-1 ml-1 text-h5 d-inline-block"
            text
            :disabled="addAction"
            max-width="500px"
            @click="switchStep('openAgentOrFlow')"
          >
            <span>
              any run
            </span>
          </v-btn>
          <span v-if="agentOrFlow === 'flow'"> from</span>
          <span v-else-if="agentOrFlow === 'agent'"> all</span>

          <v-btn
            v-if="agentOrFlow === 'flow'"
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            :color="buttonColor('selectFlow')"
            :class="format('selectFlow')"
            class="px-0 pb-1 ml-1 text-h5 d-inline-block text-truncate"
            text
            :disabled="addAction"
            max-width="500px"
            @click="
              switchStep(
                agentOrFlow === 'flow' ? 'selectFlow' : 'openAgentOrFlow'
              )
            "
          >
            <span v-if="agentOrFlow === 'agent'">{{ flowNames }}s</span>
            <truncate
              v-else-if="flowNamesList && flowNamesList.length"
              :content="flowNamesList.join(', ')"
            >
              <span>{{ flowNames }}</span>
            </truncate>
            <span v-else>{{ flowNames }}</span>
          </v-btn>

          <v-btn
            v-else-if="agentOrFlow === 'this'"
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            color="accentPink"
            class="px-0 pb-1 ml-1 text-h5 d-inline-block text-truncate"
            text
            :disabled="addAction"
            max-width="500px"
            @click="addHint"
          >
            <span>this</span>
          </v-btn>

          <v-btn
            v-else
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            :color="buttonColor('openAgentOrFlow')"
            :class="format('openAgentOrFlow')"
            class="px-0 pb-1 ml-1 text-h5 d-inline-block text-truncate"
            text
            :disabled="addAction"
            max-width="500px"
            @click="switchStep('openAgentOrFlow')"
          >
            <span v-if="agentOrFlow === 'agent'">{{ flowNames }}s</span>
            <truncate
              v-else-if="flowNamesList && flowNamesList.length"
              :content="flowNamesList.join(', ')"
            >
              <span>{{ flowNames }}</span>
            </truncate>
            <span v-else>{{ flowNames }}</span>
          </v-btn>

          <span v-if="agentOrFlow === 'agent'">
            with<v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              :color="buttonColor('chooseAgentConfig')"
              :class="format('chooseAgentConfig')"
              class="px-0 pb-1 ml-1 text-h5 d-inline-block text-truncate"
              text
              :disabled="addAction"
              max-width="500px"
              @click="switchStep('chooseAgentConfig')"
            >
              <span>
                {{
                  selectedAgentConfig && selectedAgentConfig.name
                    ? selectedAgentConfig.name + ' config'
                    : 'this config'
                }}
              </span>
            </v-btn>
          </span>

          <v-btn
            v-if="!disableStep"
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            class="px-0 pb-1 ml-1 text-h5"
            text
            :disabled="addAction || !selectedFlows.length"
            :color="buttonColor('selectEventType')"
            :class="format('selectEventType')"
            @click="switchStep('selectEventType')"
          >
            <span>
              {{ flowEventType.name }}
            </span>
          </v-btn>
          <span v-else class="pl-1">{{ flowEventType.name }}</span>
          <span v-if="isSLA">
            after

            <v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              class="px-0 pb-1 text-h5"
              text
              :disabled="addAction"
              :color="buttonColor('openDuration')"
              :class="format('openDuration')"
              @click="switchStep('openDuration')"
            >
              <span>{{ seconds }}</span>
            </v-btn>
            seconds</span
          ><span v-if="includeTo">
            to<v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              class="ml-1 px-0 pb-1 text-h5"
              :class="format('selectState')"
              text
              :disabled="addAction"
              :color="buttonColor('selectState')"
              @click="switchStep('selectState')"
            >
              <span>{{ hookStates }}</span>
            </v-btn></span
          >, then<v-btn
            :style="{
              'text-transform': 'none',
              'min-width': '0px'
            }"
            class="px-0 pb-1 ml-1 text-h5 d-inline-block text-truncate"
            text
            :disabled="disableDoThis"
            :color="buttonColor('selectDoThis')"
            :class="format('selectDoThis')"
            @click="switchStep('selectDoThis')"
            ><span>{{ addAction ? 'do this' : hookAction }}</span></v-btn
          >.
        </v-col>
        <v-col v-if="!addAction" cols="3" lg="2" class="text-right">
          <v-btn
            v-if="step.name != 'openAgentOrFlow' || hookDetail"
            text
            color="utilGrayMid"
            class="light-weight-text mr-1 px-2"
            @click="closeCard"
          >
            <span class="text-none">Cancel</span></v-btn
          ><v-btn
            color="primary"
            elevation="0"
            :loading="saving"
            :disabled="!completeAction"
            @click="createHook"
          >
            <span class="text-none">Save</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider class="my-4 " />

    <transition name="quick-fade" mode="out-in">
      <!-- OPEN AGENT OR FLOW -->
      <div v-if="step.name === 'openAgentOrFlow'" key="openAgentOrFlow">
        <div>
          <div class="mb-2 text-subtitle-1 accentPink--text font-weight-light">
            Choose an automation:
          </div>
          <v-row>
            <v-col cols="12">
              <v-btn
                v-for="item in hookTypes"
                :key="item.type"
                outlined
                depressed
                :color="
                  agentOrFlow === item.type ? 'accentPink' : 'utilGrayMid'
                "
                class="mr-4 cursor-pointer text-h6 font-weight-light remove--disabled"
                :class="{ flash: animated }"
                :disabled="!hasPermission(item.permission)"
                :input-value="agentOrFlow === item.type"
                @click="selectAgentOrFlow(item.type)"
              >
                <v-icon class="mr-3">
                  {{ item.type === 'flow' ? 'pi-flow' : 'pi-agent' }}
                </v-icon>
                <span class="text-lowercase">{{ item.label }}</span>

                <UpgradeBadge v-if="!hasPermission(item.permission)">
                  <span class="font-weight-medium"
                    ><span class="text-capitalize">{{ item.label }}</span>
                    automations</span
                  >
                  are only available on Standard and Enterprise plans.
                </UpgradeBadge>
              </v-btn>
            </v-col>
          </v-row>
        </div>
        <v-card-actions v-if="agentOrFlow !== 'this'">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            elevation="0"
            title="Next"
            @click="
              agentOrFlow === 'agent'
                ? switchStep('selectDoThis')
                : switchStep('selectFlow')
            "
            ><span class="text-none">Next</span>
          </v-btn>
        </v-card-actions>
      </div>
      <!-- END OPEN AGENT OR FLOW -->

      <!-- CHOOSE AGENT CONFIG -->
      <div
        v-else-if="step.name === 'chooseAgentConfig'"
        key="chooseAgentConfig"
      >
        <div class="pt-0 pb-8">
          <div class="mb-2 text-subtitle-1 font-weight-light">
            {{
              !showAgentConfigForm
                ? 'Choose an agent config:'
                : 'Name your agent config:'
            }}
          </div>
          <v-row v-if="!showAgentConfigForm" no-gutters>
            <v-col cols="12">
              <v-btn
                small
                elevation="0"
                color="primary"
                :class="{ flash: animated }"
                @click="showAgentConfigForm = true"
              >
                <v-icon small class="mr-2">fa-plus</v-icon>
                <span class="text-none">Create agent config</span>
              </v-btn>

              <div v-if="agentConfigs && agentConfigs.length" class="mt-4">
                <div
                  v-for="config in agentConfigs"
                  :key="config.id"
                  v-ripple
                  class="d-inline-block chip-small pa-2 my-2 mr-4 cursor-pointer text-body-1"
                  :class="{
                    active:
                      selectedAgentConfig &&
                      selectedAgentConfig.id === config.id,
                    flash: animated
                  }"
                  @click="selectAgentConfig(config)"
                >
                  <span v-if="config.name">{{ config.name }}</span>
                  <span v-else class="text--disabled"
                    >Unnamed agent config</span
                  >
                </div>
              </div>
            </v-col>
          </v-row>

          <div v-else>
            <CreateAgentConfigForm
              @close="showAgentConfigForm = false"
              @save="handleSaveAgentConfig"
            />
          </div>
        </div>

        <v-card-actions v-if="!showAgentConfigForm" class="px-0">
          <v-spacer></v-spacer>
          <v-btn
            text
            title="Previous"
            class="mr-1"
            color="utilGrayMid"
            @click="switchStep('openAgentOrFlow')"
            ><span class="text-none">Previous</span>
          </v-btn>
          <v-btn
            color="primary"
            elevation="0"
            :disabled="!selectedAgentConfig"
            title="Next"
            @click="switchStep('selectDoThis')"
          >
            <span class="text-none">Next</span>
          </v-btn>
        </v-card-actions>
      </div>
      <!-- END CHOOSE AGENT CONFIG -->

      <!-- SELECT FLOW -->
      <div v-else-if="step.name === 'selectFlow'" key="selectFlow">
        <div class="mb-2 text-subtitle-1 font-weight-light">
          Choose a flow:
        </div>

        <v-row>
          <v-col cols="12" class="pb-0">
            <!-- //need to fix v-model AND flow box color/style -->
            <v-text-field
              v-model="searchEntry"
              hide-details
              single-line
              solo
              dense
              flat
              :placeholder="placeholderMessage"
              prepend-inner-icon="search"
              autocomplete="new-password"
              class="ml-n3"
            />
            <v-checkbox
              v-model="selectAll"
              class="mt-2 d-inline-block"
              dense
              hide-details
              label="Select All"
              :indeterminate="notAll"
            ></v-checkbox>
          </v-col>
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
                    class="chip-bigger d-flex align-center justify-start pa-2 cursor-pointer"
                    :class="{ active: includesFlow(item), flash: animated }"
                    @click="selectFlow(item)"
                  >
                    <div style="width: auto;" class="text-body-1 text-truncate">
                      <div class="text-caption">{{ item.project.name }}</div>
                      <div>
                        <div style="width: 100%;" class="text-truncate">
                          {{ item.name }}
                        </div>
                      </div>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-sheet>
          </v-col>
        </v-row>
        <v-card-actions class="px-0">
          <v-spacer></v-spacer>
          <v-btn
            text
            title="Previous"
            color="utilGrayMid"
            class="mr-1"
            @click="switchStep('openAgentOrFlow')"
            ><span class="text-none">Previous</span>
          </v-btn>
          <v-btn
            color="primary"
            elevation="0"
            :disabled="!selectedFlows.length"
            title="Next"
            @click="handleFlowNext"
            ><span class="text-none">Next</span>
          </v-btn>
        </v-card-actions>
      </div>
      <!-- END SELECT FLOW -->

      <!-- SELECT EVENT TYPE -->
      <div v-else-if="step.name === 'selectEventType'" key="selectEventType">
        <div class="mb-2 text-subtitle-1 font-weight-light">
          Choose an event:
        </div>
        <div>
          <v-row>
            <v-col cols="12">
              <v-btn
                v-for="item in filteredFlowEventTypes"
                :key="item.enum"
                outlined
                depressed
                :color="
                  flowEventType.name === item.name
                    ? 'accentPink'
                    : 'utilGrayMid'
                "
                :class="{ flash: animated }"
                class="mr-4 cursor-pointer text-h6 font-weight-light remove--disabled"
                :input-value="flowEventType.name === item.name"
                :disabled="!hasPermission(item.permission)"
                @click="selectFlowEventType(item)"
                ><div class="text-center text-body-1 text-none">
                  {{ item.name }}
                </div>

                <UpgradeBadge v-if="!hasPermission(item.permission)">
                  <span class="font-weight-medium">Flow SLA automations</span>
                  are only available on Standard and Enterprise plans.
                </UpgradeBadge>
              </v-btn>
            </v-col>
          </v-row>
        </div>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            title="Previous"
            color="utilGrayMid"
            class="mr-1"
            @click="switchStep('selectFlow')"
            ><span class="text-none">Previous</span>
          </v-btn>
          <v-btn
            color="primary"
            elevation="0"
            title="Next"
            :disabled="!flowEventType.enum"
            @click="selectFlowEventType()"
          >
            <span class="text-none">Next</span>
          </v-btn>
        </v-card-actions>
      </div>
      <!-- END SELECT EVENT TYPE -->

      <!-- OPEN DURATION -->
      <div v-else-if="step.name === 'openDuration'" key="openDuration">
        <div class="mb-2 text-subtitle-1 font-weight-light">
          Choose SLA duration:
        </div>
        <div>
          <v-col class="pa-0" cols="12" sm="6" lg="3">
            <v-text-field
              v-model="seconds"
              type="number"
              :rules="[rules.required, rules.notNull]"
              :class="{ flash: animated }"
              persistent-hint
              outlined
              hide-details
              @keydown.enter="closeSeconds"
            ></v-text-field>
          </v-col>
        </div>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            title="Previous"
            class="mr-1"
            color="utilGrayMid"
            @click="switchStep('selectEventType')"
            ><span class="text-none">Previous</span>
          </v-btn>
          <v-btn
            color="primary"
            elevation="0"
            title="Next"
            @click="closeSeconds"
          >
            <span class="text-none">Next</span>
          </v-btn>
        </v-card-actions>
      </div>
      <!-- END OPEN DURATION -->

      <!-- SELECT STATE -->
      <div v-else-if="step.name === 'selectState'" key="selectState">
        <div class="mb-2 text-subtitle-1 font-weight-light">
          Choose the states that trigger this automation:
        </div>

        <v-btn
          v-for="item in stateGroups"
          :key="item.id"
          :color="dynamicStateGroup(item) ? 'accentPink' : null"
          depressed
          max-width="300px"
          :title="
            item == 'All'
              ? `Select all states`
              : `Select ${item} and all connected states`
          "
          class="mr-2"
          :class="{ 'white--text': dynamicStateGroup(item), flash: animated }"
          @click="selectStateGroup(item)"
        >
          {{ item }}
        </v-btn>

        <div v-if="dynamicStateGroup('Custom')" class="mt-4">
          <div
            v-for="item in states['All']"
            :key="item"
            v-ripple
            class="d-inline-block chip-small pa-2 mr-4 my-2 cursor-pointer text-body-1"
            :class="{ active: chosenStates.includes(item), flash: animated }"
            @click="selectStates(item)"
          >
            {{ item }}
          </div>
        </div>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            title="Previous"
            class="mr-1"
            color="utilGrayMid"
            @click="switchStep('selectEventType')"
            ><span class="text-none">Previous</span>
          </v-btn>
          <v-btn
            color="primary"
            elevation="0"
            title="Next"
            :disabled="chosenStates.length < 1"
            @click="
              steps['selectState'].complete = true
              switchStep('selectDoThis')
            "
            ><span class="text-none">Next</span>
          </v-btn>
        </v-card-actions>
      </div>
      <!-- END SELECT STATE -->

      <!-- SELECT ACTION -->
      <div v-else-if="step.name === 'selectDoThis'" key="selectDoThis">
        <div class="mb-2 text-subtitle-1 font-weight-light">
          Choose an action:
        </div>

        <v-row v-if="!addAction">
          <v-col>
            <v-btn small elevation="0" color="primary" @click="addNewAction">
              <v-icon small class="mr-2">fa-plus fa-sm</v-icon>
              <span class="text-none">New</span>
            </v-btn>
          </v-col>
        </v-row>

        <v-row v-if="!addAction" class="mt-8" no-gutters>
          <v-col cols="12">
            <div class="text-overline">
              System actions

              <UpgradeBadge
                v-if="
                  systemActions.length && !hasPermission('feature:api-action')
                "
                inline
              >
                <span class="font-weight-medium">System actions</span> are only
                available on Standard and Enterprise plans.
              </UpgradeBadge>
            </div>

            <div
              v-if="!systemActions.length"
              class="utilGrayMid--text text-body-2 font-weight-light"
            >
              There are no system actions for this automation.
            </div>

            <div
              v-for="item in systemActions"
              v-else
              :key="item.id"
              v-ripple
              class="chip-small pa-2 mr-4 my-2 cursor-pointer text-body-1 d-inline-block"
              :class="{
                active: chosenAction && chosenAction.id === item.id,
                disabled: !hasPermission('feature:api-action'),
                flash: animated
              }"
              @click="selectAction(item)"
            >
              <v-icon small class="mr-2">$prefect </v-icon
              >{{ item.name || item.action_type }}
            </div>
          </v-col>
        </v-row>

        <v-row v-if="!addAction" class="mt-8" no-gutters>
          <v-col cols="12">
            <div class="text-overline">Your actions</div>

            <div v-if="!customActions.length">
              You have no actions.
            </div>
            <div
              v-for="item in customActions"
              v-else
              :key="item.id"
              v-ripple
              class="chip-small pa-2 mr-4 my-2 cursor-pointer text-body-1 d-inline-block"
              :class="{
                active: chosenAction && chosenAction.id === item.id,
                flash: animated
              }"
              @click="selectAction(item)"
            >
              <v-icon small class="mr-2">{{
                actionIcon(item.action_type) || 'fas fa-desktop'
              }}</v-icon
              >{{ item.name || item.action_type }}
            </div>
          </v-col>
        </v-row>

        <ConfirmDialog
          :value="removeDoThisDialog"
          :loading="deleting"
          width="30vW"
          title="Are you sure you want to delete this?"
          type="error"
          @cancel="removeDoThisDialog = false"
          @confirm="removeDoThis"
          ><slot
            ><span class="red--text"
              >This will also delete any associated Automations.</span
            ></slot
          ></ConfirmDialog
        >
        <AddAction
          v-if="addAction"
          :event-type="flowEventType.enum || 'AGENT'"
          @close-action="addAction = false"
          @new-action="createAction"
        />

        <v-card-actions v-if="!addAction">
          <v-spacer></v-spacer>
          <v-btn
            text
            title="Previous"
            class="mr-1"
            color="utilGrayMid"
            @click="step = steps[previousStep]"
            ><span class="text-none">Previous</span>
          </v-btn>
          <v-btn
            color="primary"
            elevation="0"
            title="Save"
            :loading="saving"
            :disabled="!completeAction"
            @click="createHook"
            ><span class="text-none">Save</span>
          </v-btn>
        </v-card-actions>
      </div>
      <!-- END SELECT ACTION -->
    </transition>
  </v-card>
</template>

<style lang="scss" scoped>
.chip-bigger {
  border-radius: 5px;
  height: 60px;
  position: relative;
  transition: all 50ms;
  width: 100%;

  &::after {
    border: 1px solid var(--v-utilGrayLight-base);
    border-radius: 5px;
    content: '';
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }

  &.active {
    &::after {
      border: 2px solid;
      border-color: var(--v-accentPink-base) !important;
    }
  }

  &:hover,
  &:focus {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.chip-small {
  border-radius: 5px;
  max-width: fit-content;
  position: relative;
  transition: all 50ms;

  &::after {
    border: 1px solid var(--v-utilGrayLight-base);
    border-radius: 5px;
    content: '';
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }

  &.active {
    &::after {
      border: 2px solid;
      border-color: var(--v-accentPink-base) !important;
    }
  }

  &:hover,
  &:focus {
    background-color: rgba(0, 0, 0, 0.05);
  }

  &.disabled {
    color: var(--v-utilGrayLight-base) !important;
    pointer-events: none !important;
  }
}

.text-decoration-dotted-underline {
  span {
    &::after {
      border-bottom: rgba(0, 0, 0, 0.4) dashed 1.75px;
      bottom: 0;
      content: '';
      left: 0;
      position: absolute;
      width: 100%;
    }
  }
}

.flash {
  &:not(:disabled):not(.disabled) {
    animation: flash 1.5s;
  }
}

@keyframes flash {
  0%,
  50%,
  100% {
    background-color: transparent;
    border-color: currentColor !important;
  }

  25%,
  75% {
    background-color: rgba(59, 141, 255, 0.2);
    border-color: var(--v-primary-base) !important;
  }
}
</style>
