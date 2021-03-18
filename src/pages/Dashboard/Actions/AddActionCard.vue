<script>
import { mapActions, mapGetters } from 'vuex'
import AddDoThis from '@/pages/Dashboard/Actions/AddDoThis'
import { STATES } from '@/utils/cloudHooks'
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
      searchEntry: null,
      selectedFlows: this.hookDetail?.flowName || [],
      openSeconds: false,
      step: 'openAgentOrFlow',
      openSelectFlowEventType: false,
      openFlow: false,
      openAgent: false,
      openStates: false,
      openAgentOrFlow: true,
      openActions: false,
      removeDoThisDialog: false,
      flowNamesList: this.hookDetail?.flowNameList || [],
      hookDetails: this.hookDetail,
      project: null,
      stateGroups: [...Object.keys(STATES), 'Custom'],
      states: STATES,
      stateName: 'All',
      agentFlowOrSomethingElse: '',
      selectedAgent: null,
      chosenStates: this.hookDetail?.hook?.event_tags?.state || STATES['All'],
      disableClick: true,
      chosenAction: this.hookDetail?.hook?.action || null,
      seconds: this.hookDetails?.flowConfig?.duration_seconds || 60,
      addAction: false,
      flowEventType: null,
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
    projectsList() {
      return [...this.projects, { name: 'All', id: null }].sort((a, b) =>
        a.name > b.name ? 1 : -1
      )
    },
    allFlows() {
      return this.selectedFlows?.length === this.flows?.length
    },
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
      return this.flowEventType.enum == 'CHANGES_STATE'
    },
    durationSeconds() {
      return this.seconds || this.hookDetails?.flowConfig?.duration_seconds
    },
    flowNames() {
      return this.agentOrFlow === 'agent'
        ? 'agent'
        : this.flowNamesList?.length > 1
        ? 'mulitiple flows'
        : this.flowNamesList.toString() || this.agentOrFlow
    },
    hookStates() {
      return this.stateName === 'All'
        ? 'any state'
        : this.stateName === 'Custom'
        ? this.chosenStates.length != 1
          ? 'selected states'
          : this.chosenStates.toString().toLowerCase()
        : this.stateName
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
      if (this.$vuetify.breakpoint.mdAndUp) {
        return `Search by Flow, ${!this.isCloud ? 'or' : ''} Project${
          this.isCloud ? ', or User' : ''
        } `
      }
      return ''
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
      : {
          name: 'does this'
        }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    closeCard() {
      this.$emit('close')
    },
    // handleOpenAgentOrFlow() {
    //   this.openAgentOrFlow = !this.openAgentOrFlow
    // },
    switchStep(step) {
      //steps = 'openAgentOrFlow', 'selectEventType', 'selectFlow', 'selectState', 'openDuration', 'selectDoThis'
      this.step = step
    },
    selectAgentOrFlow(choice) {
      this.agentFlowOrSomethingElse = choice

      // this.openAgentOrFlow = false
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
        this.openActions = true
        this.switchStep('selectDoThis')
        // this.openSelectFlowEventType = true
        // this.openAgent = true
        // this.flow = {}
        // this.openSelectFlowEventType = false
      }
    },
    // selectAgent(choice) {
    //   this.selectedAgent = choice
    //   this.openAgent = false
    //   this.openSelectFlowEventType = true
    // },
    selectFlow(event, flow) {
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
        if (!event?.shiftKey) {
          if (this.selectedFlows?.length > 1) {
            this.flowEventType = {
              name: 'changes state',
              enum: 'CHANGES_STATE'
            }
            this.switchStep('selectState')
          } else {
            this.switchStep('selectEventType')
          }
        }
      }
      this.flowNamesList = this.selectedFlows?.map(flow => flow.name)
    },
    selectAllFlows() {
      if (!this.allFlows) {
        this.selectedFlows = this.flows
        this.flowNamesList = ['any flow']

        this.flowEventType = {
          name: 'changes state',
          enum: 'CHANGES_STATE'
        }
        this.switchStep('selectState')
      } else {
        this.selectedFlows = []
        this.flowNamesList = []
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
      if (group !== 'Custom') {
        this.disableClick = true
        this.chosenStates = this.states[group]
      } else {
        this.chosenStates = []
        this.disableClick = false
      }
    },
    selectStates(state) {
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
      this.openActions = false
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
              alertMessage: 'We hit an error!',
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
      }
    },
    async createHook() {
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
            const kind = this.flowEventType.enum
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
          if (data && this.hookDetails) {
            await this.$apollo.mutate({
              mutation: require('@/graphql/Mutations/delete-hook.gql'),
              variables: {
                hookId: this.hookDetails.hook.id
              }
            })
          }
        } else if (this.agentOrFlow === 'agent') {
          const agentConfig = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/create_agent_config.gql'),
            variables: {
              input: {}
            }
          })
          const agentHook = await this.$apollo.mutate({
            mutation: require('@/graphql/Mutations/create_agent_sla_failed_hook.gql'),
            variables: {
              input: {
                action_id: action.id,
                agent_config_ids: [agentConfig.data.create_agent_config.id]
              }
            }
          })
          data = agentHook.data
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
            alertMessage: 'Hook created',
            alertType: 'success'
          })
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
        let sortBy = {}
        if (this.sortBy) {
          if (this.isCloud && this.sortBy.includes('created_by.username')) {
            sortBy['created_by'] = {}
            sortBy['created_by']['username'] = this.sortDesc ? 'desc' : 'asc'
          } else if (Object.keys(this.sortBy) < 1) {
            sortBy = { name: 'asc' }
          } else {
            sortBy[`${this.sortBy}`] = this.sortDesc ? 'desc' : 'asc'
          }
        }

        let searchParams = [
          { archived: { _eq: this.showArchived ? null : false } },
          { project_id: { _eq: this.projectId ? this.projectId : null } }
        ]

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
          limit: this.limit,
          offset: this.limit * (this.page - 1),
          orderBy: sortBy,
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
  <v-card v-if="!addAction" width="100%">
    <v-row
      ><v-col cols="6"
        ><v-btn
          text
          class="grey--text text--darken-2 light-weight-text"
          @click="closeCard"
        >
          <v-icon>chevron_left</v-icon
          ><span style="text-transform: none;">Back </span></v-btn
        ></v-col
      >
      <v-col cols="6" class="text-right"
        ><v-btn
          class="mr-3 mt-2"
          color="primary"
          elevation="0"
          :disabled="!completeAction"
          @click="createHook"
          ><i class="far fa-cloud-upload-alt fa-lg"></i>
          <span class="pl-2">Save</span></v-btn
        ></v-col
      >
    </v-row>

    <v-card class="px-8" elevation="0">
      <v-row
        ><v-col cols="12" class="headline black--text">
          When
          <v-btn
            :style="{ 'text-transform': 'none', 'min-width': '0px' }"
            :color="
              step === 'openAgentOrFlow' || step === 'selectFlow'
                ? 'codePink'
                : 'grey'
            "
            class="px-0 pb-1 headline text-truncate"
            text
            max-width="300px"
            @click="step = 'openAgentOrFlow'"
            ><truncate
              v-if="flowNamesList && flowNamesList.length"
              :content="flowNamesList.toString()"
              >{{ flowNames }}</truncate
            ><span v-else>{{ flowNames }}</span></v-btn
          >
          <span
            >{{ ' '
            }}<span v-if="agentOrFlow === 'flow'"
              >{{ haveOrHas }} a run that
            </span>

            <v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              class="px-0 pb-1 headline"
              text
              :disabled="agentOrFlow === 'agent' || chosenStates.length > 1"
              :color="step === 'selectEventType' ? 'codePink' : 'grey'"
              @click="switchStep('selectEventType')"
            >
              {{ flowEventType.name }}</v-btn
            >
            <span v-if="isSLA">
              for

              <v-btn
                :style="{ 'text-transform': 'none', 'min-width': '0px' }"
                class="px-0 pb-1 headline text-decoration-underliney"
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
        </v-col>
      </v-row>
    </v-card>
    <v-card
      v-if="step === 'openAgentOrFlow'"
      elevation="0"
      class="ml-6 pb-4 pt-2"
    >
      <v-chip
        v-for="item in ['flow', 'agent']"
        :key="item"
        label
        :color="agentOrFlow === 'item' ? 'codePink' : 'grey'"
        max-width="300px"
        class="ma-1"
        outlined
        @click="selectAgentOrFlow(item)"
        ><v-icon class="pr-2">{{
          item === 'flow' ? 'pi-flow' : 'pi-agent'
        }}</v-icon
        >{{ item }}</v-chip
      >
    </v-card>
    <!-- <v-card v-else-if="openAgent" elevation="0" class="pa-2">
      <v-chip
        v-for="item in agents"
        :key="item.id"
        label
        max-width="300px"
        class="ma-1"
        outlined
        @click="selectAgent(item)"
        ><truncate :content="item.id">{{
          item.name != 'agent' ? item.name : item.type
        }}</truncate></v-chip
      ></v-card
    > -->
    <v-card
      v-else-if="step === 'selectFlow'"
      elevation="0"
      class="pa-2"
      :style="{ overflow: 'auto' }"
    >
      <v-card-title class="pt-0">
        <v-text-field
          v-model="searchEntry"
          class="flow-search"
          dense
          hide-details
          single-line
          solo
          flat
          :placeholder="placeholderMessage"
          prepend-inner-icon="search"
          autocomplete="new-password"
          style="min-width: 400px;"
        />
        <div class="text-right">
          <v-chip
            v-if="!searchEntry"
            color="primary"
            label
            small
            max-width="300px"
            class="mx-1"
            @click="selectAllFlows"
          >
            <v-icon>pi-flow</v-icon>
            {{ allFlows ? 'De-select all flows' : 'Select all flows' }}
          </v-chip>
          <v-chip
            small
            label
            color="primary"
            title="Next"
            class="mx-1"
            @click="selectFlow"
          >
            Next
            <v-icon small>call_made</v-icon>
          </v-chip>
        </div>
      </v-card-title>
      <v-card-subtitle class="caption mx-4 pt-1 pb-2"
        >Hint: Shift-click to select multiple flows</v-card-subtitle
      >
      <v-card-text>
        <v-row class="px-4">
          <v-col
            v-for="item in flows"
            :key="item.id"
            cols="6"
            sm="3"
            lg="2"
            class="px-1 py-0 "
          >
            <v-chip
              label
              :style="{ width: '100%', height: '60px' }"
              title="Press shift to select multiple flows"
              :color="includesFlow(item) ? 'pink' : ''"
              class="ma-1"
              outlined
              @click="selectFlow($event, item)"
              ><truncate :content="`${item.name} - ${item.project.name}`"
                ><div class="caption mt-2 mb-0">{{ item.project.name }}</div
                ><div class="font-weight-bold">{{ item.name }}</div></truncate
              ></v-chip
            ></v-col
          >
        </v-row>
      </v-card-text>
    </v-card>
    <v-card
      v-else-if="step === 'selectEventType'"
      elevation="0"
      class="pb-4 pl-6 pt-2"
      ><span v-for="item in flowEventTypes" :key="item.enum">
        <span v-if="!disableChip(item)">
          <v-chip
            label
            class="mx-2"
            :disabled="disableChip(item)"
            outlined
            @click="selectFlowEventType(item)"
            >{{ item.name }}</v-chip
          >
        </span>
      </span>
    </v-card>
    <v-card v-else-if="step === 'openDuration'" elevation="0" class="pa-2"
      ><v-card-text>
        <v-text-field
          v-model="seconds"
          type="number"
          @keydown.enter="closeSeconds"
          @blur="closeSeconds"
        ></v-text-field>
        <div class="mt-1 text-caption">
          Hint: confirm duration by pressing the Enter key
        </div>
      </v-card-text>
    </v-card>
    <v-card
      v-else-if="step === 'selectState'"
      elevation="0"
      class="pl-6 pb-4 pt-2"
    >
      <v-card-text>
        <div class="text-right">
          <v-btn
            x-small
            class="text-normal"
            color="primary"
            title="Next"
            :disabled="chosenStates.length < 1"
            @click="switchStep('selectDoThis')"
          >
            Next
            <v-icon small>call_made</v-icon>
          </v-btn>
        </div>
        <div>
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
        </div>

        <v-divider class="ma-2" />
        <div>
          <v-chip
            v-for="item in states['All']"
            :key="item"
            label
            :disabled="disableClick"
            max-width="300px"
            class="ma-1"
            outlined
            :color="chosenStates.includes(item) ? 'pink' : ''"
            @click="selectStates(item)"
            >{{ item }}</v-chip
          >
        </div>
      </v-card-text>
    </v-card>
    <v-card
      v-else-if="step === 'selectDoThis'"
      elevation="0"
      class="pb-4 pl-6 pt-2"
    >
      <v-chip class="ma-1" color="primary" label @click="addNewAction"
        ><v-icon small class="mr-2">fal fa-plus-hexagon</v-icon> New Config
      </v-chip>
      <v-chip
        v-for="item in editedActions"
        :key="item.id"
        label
        :disabled="
          item.action_type === 'CancelFlowRunAction' && agentOrFlow === 'agent'
        "
        max-width="500px"
        class="ma-1"
        outlined
        @click="selectAction(item)"
        ><truncate :content="item.name || item.action_type">{{
          item.name || item.action_type
        }}</truncate>
        <v-btn
          small
          icon
          title="Remove"
          color="red"
          @click.stop="handleRemoveClick(item)"
        >
          <i class="fas fa-times-circle fa-lg"
        /></v-btn>
      </v-chip>
      <ConfirmDialog
        :value="removeDoThisDialog"
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
    </v-card>
  </v-card>
  <AddDoThis
    v-else
    @close-action="addAction = false"
    @new-action="createAction"
  />
</template>
