<script>
import { mapGetters } from 'vuex'

import CardTitle from '@/components/Card-Title'

export default {
  components: {
    CardTitle
  },

  props: {
    agent: {
      type: Object,
      required: true
    }
  },
  data() {
    return {}
  },
  computed: {
    ...mapGetters('agent', ['staleThreshold', 'unhealthyThreshold']),
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    agentHook() {
      const hook = this.agentHooks
        ?.filter(
          hook =>
            hook.event_tags?.agent_config_id?.filter(id => {
              return id === this.agent?.agent_config_id
            }).length > 0
        )
        .map(hook => hook.action)

      return hook
    }
  },
  methods: {},
  apollo: {
    agentHooks: {
      query: require('@/graphql/Agent/agent-hooks.gql'),
      loadingKey: 'loading',
      update: data => {
        // console.log(data)
        return data.hook
      }
    }
  }
}
</script>

<template>
  <v-card tile class="agent-card px-2 pb-3" style="overflow-y: auto;">
    <CardTitle title="Agent Config" icon="pi-agent"> </CardTitle>

    <v-card-text class="my-2">
      <div v-if="!agentHook || !agentHook.length">
        No agent config attached to this agent.</div
      >
      <div v-else>
        <truncate :content="agent.id">
          Agent Config Id: {{ agent.agent_config_id || unknown }}</truncate
        >
        <div v-for="(action, index) in agentHook" :key="index">
          <div class="my-2">
            Connected Action Name{{
              agentHook && agentHook.length > 1 ? ` ${index}` : ''
            }}:
            {{ action.name }}
          </div>
          <div class="my-2">
            Connected Action Type{{
              agentHook && agentHook.length > 1 ? ` ${index}` : ''
            }}:
            {{ action.action_type }}
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.bottom-right-loaded {
  bottom: 4px;
  right: -2px;
}

.bottom-right-loading {
  bottom: 12px;
  right: -16px;
}

.pointer {
  cursor: pointer;
}

.fa-robot {
  color: var(--v-secondaryGray-base);
  float: right;
  font-size: 1.8em;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.overflow-scroll {
  overflow: scroll;
}
</style>
