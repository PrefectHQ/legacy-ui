<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'

import Label from '@/components/Label'
import moment from '@/utils/moment'
import { formatTime } from '@/mixins/formatTimeMixin'
import LastTenRuns from '@/components/LastTenRuns'
import CardTitle from '@/components/Card-Title'

const AGENT_TYPES = [
  { type: 'DockerAgent', icon: 'fab fa-docker pa-1', name: 'Docker' },
  { type: 'ECSAgent', icon: 'fab fa-aws pa-1', name: 'ECS' },
  { type: 'FargateAgent', icon: 'fab fa-aws pa-1', name: 'Fargate' },
  { type: 'KubernetesAgent', icon: 'pi-kubernetes', name: 'Kubernetes' },
  { type: 'LocalAgent', icon: 'fas fa-home', name: 'Local' },
  { type: 'NomadAgent', icon: '$nomad', name: 'Nomad' }
]

export default {
  components: {
    LastTenRuns,
    Label,
    CardTitle
  },
  mixins: [formatTime],
  props: {
    agent: {
      type: Object,
      required: true
    },
    labelRenderLimit: {
      type: Number,
      required: false,
      default: 3
    },
    selectedLabels: {
      type: Array,
      required: false,
      default: () => []
    },
    showAll: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      copiedText: {},
      labelMenuOpen: false,
      isDeleting: false,
      showConfirmDialog: false,
      submittable: this.agent.submittableRuns,
      showIcon: true,
      tab: 'overview'
    }
  },
  computed: {
    ...mapGetters('agent', ['staleThreshold', 'unhealthyThreshold']),
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    dayAgo() {
      const today = this.formatCalendarDate(new Date())
      const day = this.subtractDay(today, 2)
      return day
    },
    labelHeight() {
      return this.showAll ? '60px' : '40px'
    },
    hasLateRuns() {
      return !!this.lateRuns?.length
    },
    name() {
      return this.agent?.name && this.agent.name !== 'agent'
        ? this.agent.name
        : AGENT_TYPES.find(a => a.type == this.agent?.type)?.name || 'Agent'
    },
    secondsSinceLastQuery() {
      return this.agent.secondsSinceLastQuery
    },
    status() {
      return this.agent.status
    },
    statusColor() {
      const color =
        {
          unhealthy: 'utilGrayLight',
          late: 'deepRed',
          healthy: 'green',
          stale: 'warning'
        }[this.status] || 'secondaryGray'
      return color
    },
    iconClass() {
      const color =
        {
          unhealthy: 'unhealthy',
          late: 'late',
          healthy: 'healthy',
          stale: 'stale'
        }[this.status] || 'plain'
      return color
    },
    queryColor() {
      if (this.agent.status === 'healthy') return 'success'
      if (this.agent.status === 'stale') return 'warning'
      return 'error'
    },
    timer() {
      if (!this.agent?.last_queried) return null
      if (this.secondsSinceLastQuery < 60) {
        return `${
          this.secondsSinceLastQuery < 0 ? 0 : this.secondsSinceLastQuery
        } seconds ago`
      }

      return moment(this.agent.last_queried).fromNow()
    },
    type() {
      return this.agent?.type ? this.agent.type : 'Agent type unknown'
    },
    submittableRuns() {
      return this.agent.submittableRuns
    },
    lateRuns() {
      return this.agent.lateRuns
    },
    failedRuns() {
      const badRuns = this.recentRuns?.filter(run =>
        ['Failed', 'TriggerFailed'].includes(run.state)
      )
      return !!badRuns?.length
    },
    agentIcon() {
      return (
        AGENT_TYPES.find(a => a.type == this.agent?.type)?.icon ||
        'fad fa-globe'
      )
    },
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
  watch: {
    statusColor() {
      //attempt to make icon color update - not working
      this.showIcon = false
      setTimeout(() => {
        this.showIcon = true
      }, 150)
    }
  },
  mounted() {
    if (this.agent?.status === 'healthy') {
      this.setUpdate()
    }
  },
  beforeDestroy() {
    this.endUpdate()
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapMutations('agent', ['setRefetch']),
    ...mapActions('agent', ['setUpdate', 'endUpdate']),
    anyLabelsSelected(labels) {
      return labels.reduce((result, label) => this.labelSelected(label), false)
    },
    copyTextToClipboard(text) {
      if (!text) return

      this.copiedText = {}
      this.copiedText[text] = true
      navigator.clipboard.writeText(text)

      setTimeout(() => {
        this.copiedText = {}
        this.copiedText[text] = false
      }, 1000)
    },
    async deleteAgent() {
      try {
        this.showConfirmDialog = false
        this.isDeleting = true
        await this.$apollo.mutate({
          mutation: require('@/graphql/Agent/delete-agent.gql'),
          variables: {
            agentId: this.agent.id
          }
        })
        this.setRefetch(true)
        setTimeout(() => {
          this.isDeleting = false
        }, 10000)
      } catch (error) {
        this.isDeleting = false
        this.setAlert({
          alertShow: true,
          alertMessage:
            'We had a problem removing your Agent. Please try again.',
          alertType: 'error'
        })
      }
    },
    labelSelected(label) {
      return this.selectedLabels.includes(label)
    }
  },
  apollo: {
    recentRuns: {
      query: require('@/graphql/Agent/recent-runs.gql'),
      loadingKey: 'loadingKey',
      variables() {
        return {
          agentId: this.agent.id,
          day: this.dayAgo
        }
      },
      update: data => {
        return data.flow_run
      }
    },
    agentHooks: {
      query: require('@/graphql/Agent/agent-hooks.gql'),
      loadingKey: 'loading',
      update: data => {
        return data.hook
      }
    }
  }
}
</script>

<template>
  <v-card
    :disabled="agent.isDeleting || isDeleting"
    class="agent-card py-2"
    style="overflow-y: auto;"
    :tile="showAll"
    :height="showAll ? '380px' : '350px'"
  >
    <v-system-bar :color="statusColor" :height="5" absolute> </v-system-bar>
    <CardTitle :title="name">
      <div slot="icon" :class="iconClass" class="ml-2" icon>
        <i class="fa-2x pi-2x nav-bar-duotone-icon" :class="agentIcon"
      /></div>
      <div v-if="showAll" slot="action" class="d-flex align-end flex-column">
        <v-btn
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'overview' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'overview'
                ? 'var(--v-primary-base)'
                : 'var(--v-appForeground-base)'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = 'overview'"
        >
          Overview
          <v-icon small>calendar_view_day</v-icon>
        </v-btn>
        <v-btn
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'config' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'config'
                ? 'var(--v-primary-base)'
                : 'var(--v-appForeground-base)'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = 'config'"
        >
          Config
          <v-icon x-small>inventory_2</v-icon>
        </v-btn>
      </div>
    </CardTitle>
    <v-dialog v-model="showConfirmDialog" max-width="480">
      <v-card>
        <v-card-title class="word-break-normal">
          Are you sure you want to stop displaying this agent?
        </v-card-title>

        <v-card-text class="my-4 text-body-2">
          <strong>
            This action will not stop the agent process if it is still running
            in your infrastructure.</strong
          >
          It will only stop displaying the agent in Cloud.
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn text @click="showConfirmDialog = false">
            Cancel
          </v-btn>

          <v-btn color="error lighten-1" text @click="deleteAgent">
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card-text v-if="tab == 'overview' || !showAll" class="py-2">
      <div
        v-if="!showAll || hasLateRuns"
        class="my-2 text-subtitle-1 font-weight-light"
      >
        <v-icon small class="mr-1" :color="hasLateRuns ? 'deepRed' : 'success'">
          adjust
        </v-icon>
        <span v-if="hasLateRuns">
          {{ hasLateRuns ? lateRuns.length : 0 }}
        </span>
        <span v-else>
          {{ submittableRuns ? submittableRuns.length : 0 }}
        </span>
        {{ hasLateRuns ? 'Late submittable' : 'submittable' }}
        runs
      </div>
      <div class="my-2 text-subtitle-1 font-weight-light">
        <v-icon v-if="!showAll" small class="mr-1" :color="queryColor"
          >adjust</v-icon
        >
        <v-tooltip v-if="agent.last_queried" top>
          <template #activator="{ on }">
            <span v-on="on"> Last queried {{ timer }}</span>
          </template>
          <span>{{ formatDateTime(agent.last_queried) }}</span>
        </v-tooltip>
        <span v-else> No recent queries</span>
      </div>

      <div v-if="showAll" class="my-2 text-subtitle-1 font-weight-light">
        Core Version:
        {{ agent.core_version || 'Unknown' }}
      </div>
      <div v-if="!showAll" :style="{ 'min-height': '45px' }">
        <div class="my-2 text-subtitle-1 font-weight-light">
          Recent runs
        </div>
        <LastTenRuns
          :runs="recentRuns"
          :agent-id="agent.id"
          :disable-view="hasLateRuns"
        />
      </div>
      <div v-if="showAll" class="my-2 text-subtitle-1 font-weight-light">
        Created at {{ formatDateTime(agent.created) || 'Unknown' }}
      </div>

      <div v-if="showAll" class="my-2 text-subtitle-1 font-weight-light">
        Token {{ agent.token_name ? 'Name' : 'ID' }}:
        <v-tooltip bottom>
          <template #activator="{ on }">
            <span
              class="cursor"
              v-on="on"
              @click="copyTextToClipboard(agent.token_id)"
            >
              <v-icon x-small class="mb-2px">
                {{ copiedText[agent.token_id] ? 'check' : 'file_copy' }}
              </v-icon>
              {{ agent.token_name || agent.token_id }}
            </span>
          </template>

          <span>
            {{
              agent.token_name || agent.token_id
                ? 'Click to copy token id'
                : 'No token name found; you may have registered the agent with an older version of Prefect Core.'
            }}</span
          >
        </v-tooltip>
      </div>

      <div v-if="showAll" class="my-2 text-subtitle-1 font-weight-light">
        Agent ID:
        <v-tooltip bottom>
          <template #activator="{ on }">
            <span
              class="cursor"
              @click="copyTextToClipboard(agent.id)"
              v-on="on"
            >
              <v-icon x-small class="mb-2px">
                {{ copiedText[agent.id] ? 'check' : 'file_copy' }}
              </v-icon>
              {{ agent.id || 'Unknown' }}
            </span>
          </template>
          <span>
            Click to copy agent id
          </span>
        </v-tooltip>
      </div>
      <div>
        <div class="my-2 text-subtitle-1 font-weight-light">
          Labels
        </div>
        <v-sheet
          v-if="agent.labels && agent.labels.length"
          :height="showAll ? '60px' : '40px'"
          :style="{ overflow: 'auto' }"
        >
          <Label
            v-for="label in agent.labels"
            :key="label"
            class="mr-1 mt-1"
            :outlined="!labelSelected(label)"
            size="x-small"
            @click="$emit('label-click', $event)"
          >
            {{ label }}
          </Label>
          <!-- <span v-if="!agentModified.labels.length">
                None
              </span> -->
        </v-sheet>
        <div v-else class="text--disabled" :style="{ height: labelHeight }">
          None
        </div>
      </div>
    </v-card-text>
    <v-card-text v-else
      ><div v-if="!agentHook || !agentHook.length">
        No agent config attached to this agent.</div
      >
      <div v-else>
        <truncate :content="agent.id">
          Agent Config Id: {{ agent.agent_config_id || unknown }}</truncate
        >
        <div v-for="(action, index) in agentHook" :key="index">
          <div class="my-2 text-subtitle-1 font-weight-light">
            Action Name{{
              agentHook && agentHook.length > 1 ? ` ${index}` : ''
            }}:
            {{ action.name }}
          </div>
          <div class="my-2">
            Action Type{{
              agentHook && agentHook.length > 1 ? ` ${index}` : ''
            }}:
            {{ action.action_type }}
          </div>
        </div>
      </div>
    </v-card-text>

    <v-card-actions v-if="!showAll">
      <v-btn
        small
        text
        color="primary"
        class="mx-1"
        :to="{
          name: 'agent',
          params: { tenant: tenant.slug, id: agent.id }
        }"
      >
        More
      </v-btn>
      <v-spacer />
      <v-btn
        v-show="agent && agent.status != 'healthy'"
        small
        color="primary"
        text
        class="mx-1"
        :loading="agent.isDeleting || isDeleting"
        @click="showConfirmDialog = true"
      >
        Remove
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.late {
  color: var(--v-deepRed-base);
  --fa-primary-color: var(--v-deepRed-base);
}
.healthy {
  color: var(--v-success-base);
  --fa-primary-color: var(--v-success-base);
}
.stale {
  color: var(--v-warning-base);
  --fa-primary-color: var(--v-warning-base);
}
.unhealthy {
  color: var(--v-utilGrayLight-base);
  --fa-primary-color: var(--v-utilGrayLight-base);
}
</style>
