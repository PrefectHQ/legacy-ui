<script>
import { mapActions } from 'vuex'
import { STATES } from '@/utils/cloudHooks'

export default {
  components: {},
  props: {
    hook: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
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
      const hook = this.flowConfig
        ? `${this.hookDetails[this.flowConfig.kind]?.action}`
        : this.hookDetails[event]?.action
      return hook
    },
    seconds() {
      return this.flowConfig?.duration_seconds
    },
    hookStates() {
      const states = this.hook?.event_tags?.state
      return states.length === STATES['All'].length
        ? 'any state'
        : states.length > 1
        ? 'multiple states'
        : states.toString().toLowerCase()
    },
    hookAction() {
      return this.hook?.action?.name || this.hook?.action?.action_type
    },
    hookName() {
      const idList = this.hook?.event_tags?.flow_group_id
      const agentName =
        this.agentConfig?.agents[0]?.name === 'agent'
          ? this.agentConfig?.agents
              .map((agent, index) =>
                index === 0 ? agent.type : `or ${agent.type}`
              )
              .toString()
          : this.agentConfig?.agents
              .map((agent, index) =>
                index === 0 ? agent.name : `or ${agent.name}`
              )
              .toString()
      const name = this.hook.event_tags.agent_config_id
        ? this.agentConfig?.agents?.length > 1
          ? `${agentName}`
          : agentName
        : this.hook?.event_tags?.flow_group_id?.length > 1 && this.flowName
        ? `${this.flowName[0]?.name} and others`
        : this.flowName
        ? this.flowName[0]?.name
        : idList && !idList.length
        ? 'any flow'
        : ''
      return name
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
    async deleteHook() {
      try {
        this.deletingHook = true
        await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/delete-hook.gql'),
          variables: {
            hookId: this.hook.id
          }
        })
      } catch (error) {
        const errString = `${error}`
        this.setAlert({
          alertShow: true,
          alertMessage: errString,
          alertType: 'error'
        })
      } finally {
        this.deletingHook = false
      }
    },
    editHook() {
      this.$emit('edit-action', {
        hook: this.hook,
        flowConfig: this.flowConfig,
        flowName: this.flowName,
        flowNameList: this.flowName?.map(flow => flow.name)
      })
    }
  },
  apollo: {
    flowName: {
      query: require('@/graphql/Actions/flows.gql'),
      variables() {
        return {
          //Should we update this to include all flow names if more than one?
          flowGroupId: this.hook?.event_tags?.flow_group_id
            ? this.hook?.event_tags?.flow_group_id[0]
            : this.flowConfig?.flow_groups[0]?.flow_group_id
        }
      },
      skip() {
        const skippy =
          (!this.hook?.event_tags?.flow_group_id ||
            !this.hook?.event_tags?.flow_group_id[0]) &&
          !this.flowConfig?.flow_groups[0]?.flow_group_id
        return skippy
      },
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
  <v-card class="mb-2 headline " outlined>
    <div class="text-right">
      <v-menu :close-on-content-click="false">
        <template #activator="{ on, attrs }">
          <v-btn class="pa-8" icon title="More Actions" v-bind="attrs" v-on="on"
            ><v-icon>more_horiz</v-icon></v-btn
          ></template
        >
        <v-card
          ><div
            ><v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              text
              :loading="deletingHook"
              color="secondaryGray"
              @click="deleteHook"
              ><v-icon class="pr-4">delete</v-icon> Delete Action</v-btn
            ></div
          >
          <div>
            <v-btn
              :style="{ 'text-transform': 'none', 'min-width': '0px' }"
              text
              color="secondaryGray"
              @click="editHook"
              ><v-icon class="pr-4">edit</v-icon> Edit Action</v-btn
            ></div
          >
        </v-card></v-menu
      ></div
    >
    <div class="pl-8 pb-8 pt-0 pr-4"
      ><v-icon color="codePink" class="pr-2">{{
        hookDetails[hook.event_type] ? hookDetails[hook.event_type].icon : ''
      }}</v-icon
      ><span
        >When {{ hookType }}
        <span class="font-weight-bold">{{ hookName }}</span>
        {{ hookDetail
        }}<span v-if="includeSeconds">
          for <span class="font-weight-bold">{{ seconds }} seconds</span> </span
        ><span v-if="includeTo">
          to <span class="font-weight-bold">{{ hookStates }}</span></span
        >, then <span class="font-weight-bold">{{ hookAction }}</span
        >.</span
      >
    </div>
    <div v-if="isAgent" class=" pa-4 subtitle-2 font-weight-light"
      >To use with a new agent, add this id as the agent-config-id:
      <v-tooltip bottom>
        <template #activator="{ on }">
          <span
            class="cursor-pointer show-icon-hover-focus-only pa-2px"
            role="button"
            @click="copyToClipboard(agentConfigId)"
            v-on="on"
          >
            <v-icon x-small class="mb-2px mr-2" tabindex="0">
              {{ copiedText[agentConfigId] ? 'check' : 'file_copy' }}
            </v-icon>
            {{ agentConfigId }}
          </span>
        </template>
        <span>
          {{ agentConfigId }}
        </span>
      </v-tooltip>
    </div></v-card
  >
</template>
