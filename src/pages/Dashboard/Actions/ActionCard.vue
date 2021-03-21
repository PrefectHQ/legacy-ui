<script>
import { mapActions } from 'vuex'
import {
  ACTIONSTATES,
  titleCasePresentTenseStates,
  presentTenseStates
} from '@/utils/cloudHooks'
import AddActionCard from '@/pages/Dashboard/Actions/AddActionCard'

export default {
  components: {
    AddActionCard
  },
  props: {
    hook: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      openEdit: false,
      hookConfig: {},
      showHook: true,
      loadingHook: 0,
      copiedText: {},
      deletingHook: false,
      hookDetails: {
        FlowRunStateChangedEvent: {
          type: 'a run from',
          action: 'changes state',
          icon: 'pi-flow'
        },
        FlowSLAFailedEvent: {
          type: 'a run from',
          action: 'SLA fails',
          icon: 'pi-flow'
        },
        AgentSLAFailedEvent: {
          type: 'agent',
          icon: 'pi-agent',
          action: 'is unhealthy'
        },
        SCHEDULED_NOT_STARTED: {
          action: 'does not start'
        },
        STARTED_NOT_FINISHED: {
          action: 'does not finish'
        }
      }
    }
  },
  computed: {
    includeTo() {
      return this.hook.event_type === 'FlowRunStateChangedEvent'
    },
    isAgent() {
      return !!this.hook?.event_tags?.agent_config_id
    },
    states() {
      return this.hook?.event_tags?.state
    },
    agentConfigId() {
      return this.hook?.event_tags?.agent_config_id[0]
    },
    includeSeconds() {
      return this.flowConfig
    },
    hookType() {
      const event = this.hook?.event_type
      return `${this.hookDetails[event]?.type} `
    },
    hookDetail() {
      const event = this.hook?.event_type
      if (event === 'FlowRunStateChangedEvent') return ''
      const hook = this.flowConfig
        ? `${this.hookDetails[this.flowConfig.kind]?.action}`
        : this.hookDetails[event]?.action
      return hook
    },
    seconds() {
      return this.flowConfig?.duration_seconds
    },
    hookStates() {
      return this.states?.length === ACTIONSTATES['All']?.length
        ? 'changes to any state'
        : this.states?.length != 1
        ? 'changes to selected states'
        : presentTenseStates[this.states[0]] ||
          titleCasePresentTenseStates[this.states[0]]
    },
    hookAction() {
      return this.hook?.action?.name || this.hook?.action?.action_type
    },
    hookName() {
      const idList = this.hook?.event_tags?.flow_group_id
      const agentName =
        this.agentConfig?.agents.length == 1
          ? this.agentConfig.agents[0].name === 'agent'
            ? this.agentConfig.agents[0].type
            : this.agentConfig.agents[0].name
          : this.agentConfig?.agents
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
      const name = this.hook.event_tags.agent_config_id
        ? agentName
        : this.hook?.event_tags?.flow_group_id?.length > 2 && this.flowName
        ? `${this.flowName[0]?.name} and others`
        : this.hook?.event_tags?.flow_group_id?.length == 2 && this.flowName
        ? `${this.flowName[0].name} and ${this.flowName[1].name}`
        : this.flowName
        ? this.flowName[0]?.name
        : idList && !idList.length
        ? 'any flow'
        : ''
      return name
    },
    flowNameList() {
      return this.flowName?.map(flow => flow.name)
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    copyToClipboard(value) {
      this.copiedText = {}
      this.copiedText[value] = true
      navigator.clipboard.writeText(value)

      setTimeout(() => {
        this.copiedText = {}
        this.copiedText[value] = false
      }, 600)
    },
    stateVerb(state) {
      return (
        presentTenseStates[state] ||
        titleCasePresentTenseStates[state] ||
        'changes state'
      )
    },
    async deleteHook() {
      let success
      try {
        this.deletingHook = true
        success = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/delete-hook.gql'),
          variables: {
            hookId: this.hook.id
          }
        })
        if (success.data?.delete_hook?.success) this.showHook = false
      } catch (error) {
        const errString = `${error}`
        this.setAlert({
          alertShow: true,
          alertMessage: errString,
          alertType: 'error'
        })
      }
    },
    closeCard() {
      this.openEdit = false
    },
    editHook() {
      this.hookConfig = {
        hook: this.hook,
        flowConfig: this.flowConfig,
        flowName: this.flowName,
        flowNameList: this.flowNameList,
        agentConfig: this.agentConfig
      }
      this.$emit('open-edit')
      this.openEdit = true
      // this.$emit('edit-action', {
      //   hook: this.hook,
      //   flowConfig: this.flowConfig,
      //   flowName: this.flowName,
      //   flowNameList: this.flowNameList,
      //   agentConfig: this.agentConfig
      // })
    }
  },
  apollo: {
    flowName: {
      query: require('@/graphql/Actions/flows.gql'),
      variables() {
        return {
          flowGroupIds: this.hook?.event_tags?.flow_group_id
            ? this.hook?.event_tags?.flow_group_id
            : this.flowConfig?.flow_groups?.map(flow => flow.flow_group_id)
        }
      },
      skip() {
        const skippy =
          (!this.hook?.event_tags?.flow_group_id ||
            !this.hook?.event_tags?.flow_group_id[0]) &&
          !this.flowConfig?.flow_groups[0]?.flow_group_id
        return skippy
      },
      loadingKey: 'loadingHook',
      update: data => {
        return data.flow
      }
    },
    agentConfig: {
      query: require('@/graphql/Actions/agentConfig.gql'),
      variables() {
        return {
          agentConfigId: this.hook?.event_tags?.agent_config_id[0] || ''
        }
      },
      loadingKey: 'loadingHook',
      skip() {
        return (
          !this.hook?.event_tags?.agent_config_id ||
          !this.hook?.event_tags?.agent_config_id[0]
        )
      },
      update: data => {
        return data.agent_config_by_pk
      }
    },
    flowConfig: {
      query: require('@/graphql/Actions/flowConfigs.gql'),
      variables() {
        return {
          flowSLAConfigId: this.hook?.event_tags?.flow_sla_config_id
            ? this.hook?.event_tags?.flow_sla_config_id[0]
            : ''
        }
      },
      loadingKey: 'loadingHook',
      skip() {
        return (
          !this.hook?.event_tags?.flow_sla_config_id ||
          !this.hook?.event_tags?.flow_sla_config_id[0]
        )
      },
      update: data => {
        return data.flow_sla_config_by_pk
      }
    }
  }
}
</script>

<template>
  <v-skeleton-loader
    v-if="loadingHook > 0 && showHook"
    type="list-item-avatar-three-line"
  ></v-skeleton-loader>
  <AddActionCard
    v-else-if="openEdit"
    :hook-detail="hookConfig"
    class="my-2"
    @close="closeCard"
  />
  <v-card
    v-else-if="showHook"
    class="my-2 headline "
    outlined
    @click="editHook"
  >
    <v-card-title class="py-0 px-0">
      <v-spacer></v-spacer>
      <v-menu :close-on-content-click="false">
        <template #activator="{ on, attrs }">
          <v-btn class="px-2" text title="More Actions" v-bind="attrs" v-on="on"
            ><v-icon>more_horiz</v-icon></v-btn
          ></template
        >
        <v-card>
          <div
            ><v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              text
              width="100%"
              color="secondaryGray"
              @click="editHook"
              ><v-icon class="pl-0 pr-4">edit</v-icon>
              <span class="pr-2">Edit</span>
            </v-btn></div
          ><div
            ><v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              text
              :loading="deletingHook"
              width="100%"
              color="secondaryGray"
              @click="deleteHook"
              ><v-icon class="pr-4">delete</v-icon> Delete</v-btn
            ></div
          >
        </v-card></v-menu
      ></v-card-title
    >
    <v-card-text class="headline"
      ><v-icon color="codePink" class="pr-2">{{
        hookDetails[hook.event_type] ? hookDetails[hook.event_type].icon : ''
      }}</v-icon
      ><span
        >When <span v-if="!hookName">an </span>{{ hookType }}
        <v-tooltip v-if="flowName && flowName.length > 2" top>
          <template #activator="{ on }">
            <span class="font-weight-bold" v-on="on">{{
              hookName
            }}</span> </template
          >{{ flowNameList.toString() }}</v-tooltip
        >
        <span v-else class="font-weight-bold">{{ hookName }}</span>
        {{ hookDetail
        }}<span v-if="includeSeconds">
          for
          <span class="font-weight-bold">{{ seconds }} seconds</span> </span
        ><v-tooltip v-if="includeTo" top>
          <template #activator="{ on }">
            <span v-on="on">{{ hookStates }}</span></template
          ><span>{{ states.toString() }}</span></v-tooltip
        >, then <span class="font-weight-bold">{{ hookAction }}</span
        >.</span
      >
      <div v-if="isAgent" class="subtitle-2 font-weight-light"
        >To use with a new agent, add this id as the agent-config-id:
        <v-tooltip bottom>
          <template #activator="{ on }">
            <span
              class="cursor-pointer show-icon-hover-focus-only pa-2px"
              role="button"
              @click="copyToClipboard(agentConfigId)"
              v-on="on"
            >
              {{ agentConfigId }}
              <v-icon x-small class="mb-2px mr-2" tabindex="0">
                {{ copiedText[agentConfigId] ? 'check' : 'file_copy' }}
              </v-icon>
            </span>
          </template>
          <span> Click to copy {{ agentConfigId }} </span>
        </v-tooltip>
      </div></v-card-text
    ></v-card
  >
</template>
