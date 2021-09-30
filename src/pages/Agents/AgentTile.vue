<script>
import { mapGetters, mapActions } from 'vuex'

import Label from '@/components/Label'
import moment from '@/utils/moment'
import { formatTime } from '@/mixins/formatTimeMixin'
import LastTenRuns from '@/components/LastTenRuns'
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'

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
    CardTitle,
    DurationSpan
  },
  mixins: [formatTime],
  props: {
    rawAgent: {
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
    const tabs = {
      overview: 0,
      config: 1
    }

    return {
      copiedText: {},
      labelMenuOpen: false,
      isDeleting: false,
      showConfirmDialog: false,
      loading: 0,
      showIcon: true,
      tab: tabs.overview,
      tabs
    }
  },
  computed: {
    ...mapGetters('agent', ['staleThreshold', 'unhealthyThreshold']),
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    agent() {
      const agent = { ...this.rawAgent }
      const getTimeOverdue = time => new Date() - new Date(time)
      agent.submittableRuns = []
      agent.lateRuns = []

      if (!agent.labels?.length) {
        const noLabels = this.flowRuns?.filter(flowRun => {
          return !flowRun?.labels?.length
        })
        agent.submittableRuns = noLabels?.filter(
          flowRun => getTimeOverdue(flowRun.scheduled_start_time) <= 20000
        )
        agent.lateRuns = noLabels?.filter(
          flowRun => getTimeOverdue(flowRun.scheduled_start_time) > 20000
        )
      } else {
        const match = this.flowRuns?.filter(
          flowRun =>
            flowRun?.labels?.length &&
            flowRun.labels.every(label => agent?.labels?.includes(label))
        )
        agent.submittableRuns = match?.filter(
          flowRun => getTimeOverdue(flowRun.scheduled_start_time) <= 20000
        )
        agent.lateRuns = match?.filter(
          flowRun => getTimeOverdue(flowRun.scheduled_start_time) > 20000
        )
      }
      return agent
    },
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
      return this.agent?.lateRuns?.length ? 'late' : this.agent.status
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
      if (this.agent.secondsSinceLastQuery < 60 * this.staleThreshold)
        return 'success'
      if (this.agent.secondsSinceLastQuery < 60 * this.unhealthyThreshold)
        return 'warning'
      return 'error'
    },
    timer() {
      if (!this.agent?.last_queried) return null
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
    },
    getDateTime() {
      if (this.agent?.created) {
        const time = this.formatDateTime(this.agent.created)
        const formattedTime = time.charAt(0).toLowerCase() + time.slice(1)
        return `Created ${formattedTime}`
      }
      return 'No creation time recorded'
    }
  },
  mounted() {
    this.$globalApolloQueries['agents'].refetch()
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
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
        this.$globalApolloQueries['agents'].refetch()
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
      loadingKey: 'loading',
      variables() {
        return {
          agentId: this.rawAgent?.id,
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
      skip() {
        return !this.isCloud
      },
      update: data => {
        return data.hook
      }
    },
    flowRuns: {
      query: require('@/graphql/Agent/FlowRuns.gql'),
      pollInterval: 1000,
      fetchPolicy: 'no-cache',
      update(data) {
        return data.flow_run
      }
    }
  }
}
</script>

<template>
  <v-card
    :disabled="agent.isDeleting || isDeleting"
    class="agent-card py-2"
    :tile="showAll"
    :height="showAll ? '380px' : '350px'"
  >
    <v-system-bar :color="statusColor" :height="5" absolute> </v-system-bar>
    <CardTitle :title="name">
      <div slot="icon" :class="iconClass" class="ml-2" icon>
        <i class="fa-2x pi-2x nav-bar-duotone-icon" :class="agentIcon" />
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

    <v-tabs
      v-if="showAll && isCloud"
      v-model="tab"
      tabs-border-bottom
      color="primary"
      class="flex-grow-0"
    >
      <v-tab :key="tabs.overview" data-cy="details-tile-overview">
        Overview
      </v-tab>
      <v-tab :key="tabs.config" data-cy="details-tile-config">
        Config
      </v-tab>
    </v-tabs>

    <v-card-text
      v-if="tab == tabs.overview || !showAll"
      class="py-2"
      :style="showAll ? '' : { height: '250px' }"
    >
      <div v-if="!showAll" class="my-2 text-subtitle-1 font-weight-light ">
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

      <div v-if="!showAll" class="my-2 text-subtitle-1 font-weight-light ">
        <v-icon small class="mr-1" :color="queryColor">adjust</v-icon>
        <v-tooltip v-if="agent.last_queried" top>
          <template #activator="{ on }">
            <span v-on="on">
              Last queried
              <span v-if="secondsSinceLastQuery < 60">
                <DurationSpan :start-time="agent.last_queried" /> ago
              </span>
              <span v-else>{{ timer }}</span>
            </span>
          </template>
          <span>{{ formatDateTime(agent.last_queried) }}</span>
        </v-tooltip>
        <span v-else> No recent queries</span>
      </div>
      <div v-else class="my-2 text-subtitle-1">
        <v-row no-gutters>
          <v-col cols="4">
            Last queried
          </v-col>
          <v-col cols="8" class="text-right font-weight-bold">
            <v-tooltip v-if="agent.last_queried" top>
              <template #activator="{ on }">
                <span v-on="on">
                  <span v-if="secondsSinceLastQuery < 60">
                    <DurationSpan :start-time="agent.last_queried" /> ago
                  </span>
                  <span v-else>{{ timer }}</span>
                </span>
              </template>
              <span>{{ formatDateTime(agent.last_queried) }}</span>
            </v-tooltip>
            <span v-else> No recent queries</span>
          </v-col>
        </v-row>
      </div>

      <div v-if="showAll" class="my-2 text-subtitle-1">
        <v-row no-gutters>
          <v-col cols="4">
            Core Version
          </v-col>
          <v-col cols="8" class="text-right font-weight-bold">
            {{ agent.core_version || 'Unknown' }}
          </v-col>
        </v-row>
      </div>

      <div v-if="!showAll" :style="{ height: '70px' }">
        <div class="mt-2 text-subtitle-1">
          Recent runs
        </div>
        <div v-if="loading < 1 && (!recentRuns || !recentRuns.length)">
          <div class="text-xs-subtitle-1 grey--text timeline-no-runs"
            >No run history
          </div>
        </div>
        <LastTenRuns
          :runs="recentRuns"
          :agent-id="agent.id"
          :disable-view="hasLateRuns"
        />
      </div>
      <div v-if="showAll" class="my-2 text-subtitle-1">
        <v-row no-gutters>
          <v-col cols="4">
            Created At
          </v-col>
          <v-col cols="8" class="text-right font-weight-bold">
            {{ formatTime(agent.created) }}
          </v-col>
        </v-row>
      </div>
      <div v-if="showAll && isCloud" class="my-2 text-subtitle-1">
        <v-row no-gutters>
          <v-col :cols="agent.token_name ? 4 : 2">
            Token {{ agent.token_name ? 'Name' : 'ID' }}
          </v-col>
          <v-col
            :cols="agent.token_name ? 8 : 10"
            class="text-right font-weight-bold"
          >
            <div class="text-truncate show-icon">
              <span class="cursor" @click="copyTextToClipboard(agent.token_id)">
                <v-icon x-small class="mb-2px hidden-icon mr-1">
                  {{ copiedText[agent.token_id] ? 'check' : 'file_copy' }}
                </v-icon>
                <span>{{ agent.token_name || agent.token_id }}</span>
              </span>
            </div>
          </v-col>
        </v-row>
      </div>

      <div v-if="showAll" class="my-2 text-subtitle-1">
        <v-row no-gutters>
          <v-col cols="3">
            Agent ID
          </v-col>
          <v-col cols="9" class="text-right font-weight-bold">
            <div class="text-truncate show-icon">
              <span class="cursor" @click="copyTextToClipboard(agent.id)">
                <v-icon x-small class="mb-2px hidden-icon mr-1">
                  {{ copiedText[agent.id] ? 'check' : 'file_copy' }}
                </v-icon>
                <span>{{ agent.id || 'Unknown' }}</span>
              </span>
            </div>
          </v-col>
        </v-row>
      </div>
      <div>
        <div class="my-2 " :class="showAll ? 'subtitle-1' : 'text-subtitle-1'">
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
        <div
          v-else
          class="text--disabled my-2"
          :class="showAll ? 'subtitle-1' : 'text-subtitle-1'"
          :style="{ height: labelHeight }"
        >
          None
        </div>
      </div>
    </v-card-text>
    <v-card-text v-else
      ><div
        v-if="!agentHook || !agentHook.length"
        class="my-2 text-subtitle-1 font-weight-light text-center"
      >
        No config</div
      >
      <div v-else class="my-2 text-subtitle-1 font-weight-dark">
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
          <div class="my-2 text-subtitle-1 font-weight-light ">
            Action Type{{
              agentHook && agentHook.length > 1 ? ` ${index}` : ''
            }}:
            {{ action.action_type }}
          </div>
        </div>
      </div>
    </v-card-text>

    <v-card-actions v-if="!showAll" class="pt-0">
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

.timeline-no-runs {
  left: 50%;
  position: absolute;
  top: 52%;
  transform: translate(-50%, -50%);
}

.hidden-icon {
  display: none;
}

.show-icon:hover .hidden-icon {
  display: inline;
}
</style>
