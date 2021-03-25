<script>
import { mapActions, mapGetters } from 'vuex'
import AddAction from '@/pages/Dashboard/Automations/AddAction'
import { AUTOMATIONSTATES, flowEventTypes } from '@/utils/automations'
import ConfirmDialog from '@/components/ConfirmDialog'

export default {
  components: {
    AddAction,
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
      steps: {
        openAgentOrFlow: { name: 'openAgentOrFlow', complete: false },
        selectFlow: { name: 'selectFlow', complete: false },
        selectEventType: { name: 'selectEventType', complete: false },
        selectState: { name: 'selectState', complete: false },
        openDuration: { name: 'openDuration', complete: false },
        selectDoThis: { name: 'selectDoThis', complete: false }
      },
      selectAll: false,
      deleting: false,
      saving: false,
      searchEntry: null,
      selectedFlows: this.hookDetail?.flowName || [],
      step: null,
      removeDoThisDialog: false,
      flowNamesList: this.hookDetail?.flowNameList || [],
      hookDetails: this.hookDetail,
      project: null,
      stateGroups: Object.keys(AUTOMATIONSTATES),
      states: AUTOMATIONSTATES,
      stateName: '',
      agentFlowOrSomethingElse: '',
      chosenStates:
        this.hookDetail?.hook?.event_tags?.state || AUTOMATIONSTATES['All'],
      disableClick: false,
      chosenAction: this.hookDetail?.hook?.action || null,
      seconds: this.hookDetails?.flowConfig?.duration_seconds || 60,
      addAction: false,
      flowEventType: null,
      flowEventTypes: flowEventTypes,
      notAll: !!this.hookDetail?.flowName || false,
      isActive: false
    }
  },
  computed: {
    ...mapGetters('data', ['projects']),
    //We can not update an agent for now - config id needs to be added at agent creation
    // ...mapGetters('an agent', ['agents']),
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
        return 'an agent'
      return 'this'
    },
    disableStep() {
      return this.agentOrFlow === 'an agent' || this.selectedFlows.length > 1
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
          ) || this.agentOrFlow === 'an agent'
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
          ? this.HookDetail?.agentConfig?.agents[0]?.name === 'an agent'
            ? this.HookDetail?.agentConfig?.agents[0]?.type
            : this.hookDetail?.agentConfig?.agents[0]?.name
          : this.hookDetail?.agentConfig?.agents
              .map((agent, index) => {
                if (index === 0) {
                  return agent.name === 'an agent' ? agent.type : agent.name
                } else {
                  return agent.name === 'an agent'
                    ? `or ${agent.type}`
                    : `or ${agent.name}`
                }
              })
              .toString()
      return this.agentOrFlow === 'an agent'
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
      if (this.agentOrFlow === 'an agent') return !!this.chosenAction
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
      ? { name: 'is unhealthy' }
      : {
          name: 'does this'
        }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    buttonColor(selectedStep, otherStep) {
      // const stepComplete = this.steps[selectedStep]
      // const otherComplete = this.steps[otherStep]
      return this.step.name === selectedStep || this.step.name === otherStep
        ? 'codePink'
        : 'utilGrayDark'
    },
    format(selectedStep, otherStep) {
      const stepComplete = this.steps[selectedStep]
      const otherComplete = this.steps[otherStep]
      return this.step.name === selectedStep || this.step.name === otherStep
        ? ''
        : stepComplete?.complete || otherComplete?.complete
        ? ''
        : 'font-weight-light'
    },
    closeCard() {
      if (this.hookDetail) this.$emit('close')
      else {
        this.$emit('refresh')
      }
    },
    switchStep(selectedStep) {
      if (this.step.name === 'openDuration')
        this.steps['openDuration'].complete = true
      this.step = this.steps[selectedStep]
    },
    selectAgentOrFlow(choice) {
      this.agentFlowOrSomethingElse = choice
      if (choice === 'a flow') {
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
      if (choice === 'an agent') {
        this.flowEventType = { name: 'is unhealthy' }
        this.flowNamesList = []
        this.selectedFlows = []
        this.allFlows = false
        this.steps['openAgentOrFlow'].complete = true
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
      this.steps['openAgentOrFlow'].complete = true
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
      this.steps['selectState'].complete = true
      this.stateName = group
      this.chosenStates = this.states[group]
    },
    selectStates(state) {
      this.steps['selectState'].complete = true
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
        this.agentOrFlow === 'an agent'
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
              mutation: require('@/graphql/Mutations/create_flow_run_state_changed_hook.gql'),
              variables: {
                input: inputObject
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
        } else if (this.agentOrFlow === 'an agent') {
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
      query: require('@/graphql/Automations/actions.gql'),
      update: data => {
        return data.action
      }
    }
  }
}
</script>

<template>
  <v-card outlined>
    <v-card-text class="text-h6">
      <v-row>
        <v-col cols="9" lg="10">
          When<span v-if="agentOrFlow === 'a flow'"> a run from</span
          ><v-btn
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            :color="buttonColor('selectFlow', 'openAgentOrFlow')"
            :class="format('selectFlow', 'openAgentOrFlow')"
            class="px-0 pb-1 ml-1 text-h6 d-inline-block text-truncate"
            text
            max-width="500px"
            @click="switchStep('openAgentOrFlow')"
            ><truncate
              v-if="flowNamesList && flowNamesList.length"
              :content="flowNamesList.toString()"
              >{{ flowNames }}</truncate
            ><span v-else>{{ flowNames }}</span></v-btn
          >

          <v-btn
            v-if="!disableStep"
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            class="px-0 pb-1 ml-1 text-h6"
            text
            :color="buttonColor('selectEventType')"
            :class="format('selectEventType')"
            @click="switchStep('selectEventType')"
          >
            {{ flowEventType.name }}</v-btn
          ><span v-else class="pl-1">{{ flowEventType.name }}</span>
          <span v-if="isSLA">
            for

            <v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              class="px-0 pb-1 text-h6"
              text
              :color="buttonColor('openDuration')"
              :class="format('openDuration')"
              @click="switchStep('openDuration')"
            >
              {{ seconds }}</v-btn
            >
            seconds</span
          ><span v-if="includeTo">
            to
            <v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              class=" px-0 pb-1 text-h6"
              :class="format('selectState')"
              text
              :color="buttonColor('selectState')"
              @click="switchStep('selectState')"
            >
              {{ hookStates }}</v-btn
            ></span
          >, then<v-btn
            :style="{
              'text-transform': 'none',
              'min-width': '0px'
            }"
            class="px-0 pb-1 ml-1 text-h6 d-inline-block text-truncate"
            text
            :color="buttonColor('selectDoThis')"
            :class="format('selectDoThis')"
            @click="switchStep('selectDoThis')"
            >{{ hookAction }}</v-btn
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
            <span style="text-transform: none;">Cancel</span></v-btn
          ><v-btn
            color="primary"
            elevation="0"
            :loading="saving"
            :disabled="!completeAction"
            @click="createHook"
          >
            <span style="text-transform: none;">Save</span>
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
    <div v-if="step.name === 'openAgentOrFlow'">
      <v-card-text>
        <v-row class="px-1">
          <div
            v-for="item in ['a flow', 'an agent']"
            :key="item"
            v-ripple
            class="chip-small px-2 pb-2 pt-1 ma-2 cursor-pointer text-body-1"
            :class="{ active: agentOrFlow === item }"
            @click="selectAgentOrFlow(item)"
            ><div class="text-center"
              ><v-icon class="pr-2 pb-1">{{
                item === 'a flow' ? 'pi-flow' : 'pi-agent'
              }}</v-icon
              >{{ item }}</div
            ></div
          >
        </v-row>
      </v-card-text>
      <v-card-actions v-if="agentOrFlow !== 'this'">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          elevation="0"
          title="Next"
          class="mx-1"
          @click="
            agentOrFlow === 'an agent'
              ? switchStep('selectDoThis')
              : switchStep('selectFlow')
          "
          ><span style="text-transform: none;"> Next</span>
        </v-btn>
      </v-card-actions>
    </div>
    <v-sheet v-else-if="step.name === 'selectFlow'" class="pa-4">
      <v-row
        ><v-col cols="12" class="py-0">
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
          />
          <v-checkbox
            v-model="selectAll"
            class="mx-2 mt-2"
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
                  :class="{ active: includesFlow(item) }"
                  @click="selectFlow(item)"
                >
                  <div style="width: auto;" class="text-body-1 text-truncate">
                    <div class="caption">{{ item.project.name }}</div
                    ><div
                      ><div style="width: 100%;" class="text-truncate">{{
                        item.name
                      }}</div></div
                    >
                  </div>
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
          ><span style="text-transform: none;"> Next</span>
        </v-btn>
      </v-card-actions>
    </v-sheet>

    <div v-else-if="step.name === 'selectEventType'"
      ><v-card-text>
        <v-row class="px-1">
          <div
            v-for="item in filteredFlowEventTypes"
            :key="item.enum"
            v-ripple
            class="chip-small pa-2 ma-2 cursor-pointer text-body-1"
            :class="{ active: flowEventType.name === item.name }"
            @click="selectFlowEventType(item)"
            ><div class="text-center text-body-1">{{ item.name }}</div>
          </div>
        </v-row>
      </v-card-text>
      <v-card-actions v-if="flowEventType.enum">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          elevation="0"
          title="Next"
          class="mx-1"
          @click="selectFlowEventType()"
          ><span style="text-transform: none;"> Next</span>
        </v-btn>
      </v-card-actions>
    </div>
    <div v-else-if="step.name === 'openDuration'">
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
          ><span style="text-transform: none;"> Next</span>
        </v-btn></v-card-actions
      ></div
    >

    <v-card-text v-else-if="step.name === 'selectState'">
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
      <v-row class="px-1">
        <div
          v-for="item in states['All']"
          :key="item"
          v-ripple
          class="chip-small pa-2 ma-2 cursor-pointer text-body-1"
          :class="{ active: chosenStates.includes(item) }"
          @click="selectStates(item)"
        >
          {{ item }}
        </div>
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
          ><span style="text-transform: none;"> Next</span>
        </v-btn></v-card-actions
      ></v-card-text
    >

    <v-card-text v-else-if="step.name === 'selectDoThis'">
      <v-row v-if="!addAction" class="px-3">
        <v-btn small elevation="0" color="primary" @click="addNewAction"
          ><v-icon small class="mr-2">fa-plus</v-icon
          ><span style="text-transform: none;">New Action</span>
        </v-btn>
      </v-row>

      <v-row v-if="!addAction" class="py-2 px-1">
        <div v-if="!editedActions.length" class="mx-2"
          >You have no actions yet.</div
        >
        <div
          v-for="item in editedActions"
          v-else
          :key="item.id"
          v-ripple
          class="chip-small pa-2 ma-2 cursor-pointer text-body-1"
          :class="{ active: chosenAction === item }"
          :disabled="
            item.action_type === 'CancelFlowRunAction' &&
              agentOrFlow === 'an agent'
          "
          @click="selectAction(item)"
          >{{ item.name }}
          <!-- <v-spacer></v-spacer>
            <v-btn
              small
              icon
              title="Remove"
              color="codePink"
              @click.stop="handleRemoveClick(item)"
            >
              <i class="fas fa-times-circle fa-lg"
            /></v-btn> -->
        </div>
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
            >This will also delete any associated Automations.</span
          ></slot
        ></ConfirmDialog
      >
      <AddAction
        v-if="addAction"
        :event-type="flowEventType.enum || 'an agent'"
        @close-action="addAction = false"
        @new-action="createAction"
      />
    </v-card-text>
  </v-card>
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
  max-width: fit-content;
  transition: all 50ms;

  &.active {
    border-color: var(--v-codePink-base) !important;
  }

  &:hover,
  &:focus {
    background-color: rgba(0, 0, 0, 0.05);
  }
}
</style>
