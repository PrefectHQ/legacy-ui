<script>
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
      hookDetails: {
        FlowRunStateChangedEvent: {
          type: 'flow',
          action: 'changes state',
          icon: 'pi-flow'
        },
        FlowSLAFailedEvent: {
          type: 'flow',
          action: 'SLA fails',
          icon: 'pi-flow'
        },
        SCHEDULED_NOT_STARTED: {
          action: 'is scheduled but does not start'
        },
        STARTED_NOT_FINISHED: {
          action: 'starts but does not finish'
        }
      },
      actionDetails: {
        SlackNotificationAction: {
          title: 'send a slack notification'
        }
      },
      hookSwitch: true
    }
  },
  computed: {
    offOrOn() {
      return this.hookSwitch ? 'Off' : 'On'
    },
    includeTo() {
      return this.hook.event_type === 'FlowRunStateChangedEvent'
    },
    hookText() {
      const event = this.hook?.event_type
      // name is if a flow group is named on the evnt - may need to updated to handle multiple
      const name = this.flowName ? this.flowName[0]?.name : ''
      const hook = this.flowConfig
        ? `${this.hookDetails[this.flowConfig.kind]?.action} for ${
            this.flowConfig.duration_seconds
          } seconds`
        : this.hookDetails[event]?.action
      return `${this.hookDetails[event]?.type} ${name} ${hook}`
    },
    hookStates() {
      const states = this.hook?.event_tags?.state
      return states.toString().toLowerCase()
    },
    hookAction() {
      return this.hook?.action?.name
    },
    hookName() {
      return this.hook?.action?.name
    }
  },
  apollo: {
    flowName: {
      query: require('@/graphql/Actions/flows.gql'),
      variables() {
        return {
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
  <v-card class="px-4 mb-2 headline " outlined>
    <v-row no-gutters>
      <v-col cols="11"></v-col>
      <v-col cols="1">
        <v-switch v-model="hookSwitch" inset color="primary"></v-switch
      ></v-col> </v-row
    ><v-row
      ><v-col class="pl-8 pb-8 pt-0" cols="12"
        ><v-icon color="codePink" class="pr-2">{{
          hookDetails[hook.event_type].icon
        }}</v-icon
        >When <span class="font-weight-bold"> {{ hookText }}</span>
        <span v-if="includeTo">
          to <span class="font-weight-bold">{{ hookStates }}</span></span
        >, then <span class="font-weight-bold">{{ hookAction }}</span></v-col
      >
    </v-row></v-card
  >
</template>
