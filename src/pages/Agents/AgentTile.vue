<script>
import { mapGetters, mapActions } from 'vuex'

// import CardTitle from '@/components/Card-Title'
import Label from '@/components/Label'
import moment from '@/utils/moment'
import { formatTime } from '@/mixins/formatTimeMixin'
import LastTenRuns from '@/components/LastTenRuns'

const AGENT_TYPES = [
  { type: 'DockerAgent', icon: 'fab fa-docker pa-1', name: 'Docker' },
  { type: 'ECSAgent', icon: 'fab fa-aws pa-1', name: 'ECS' },
  { type: 'FargateAgent', icon: 'fab fa-aws pa-1', name: 'Fargate' },
  { type: 'KubernetesAgent', icon: 'pi-kubernetes', name: 'Kubernetes' },
  { type: 'LocalAgent', icon: 'far fa-home pa-1', name: 'Local' },
  { type: 'NomadAgent', icon: '$nomad', name: 'Nomad' }
]

export default {
  components: {
    // CardTitle,
    LastTenRuns,
    Label
  },
  filters: {
    formatDateTime(value) {
      if (!value) return 'None'
      return moment(value).format('h:mma z')
    }
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
      currentDateTime: moment().format(),
      labelMenuOpen: false,
      interval: null,
      isDeleting: false,
      showConfirmDialog: false,
      showLastQuery: true,
      submittable: this.agent.submittableRuns,
      newStatus: '',
      showIcon: false,
      failedRuns: []
    }
  },
  computed: {
    ...mapGetters('agent', ['staleThreshold', 'unhealthyThreshold']),
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    dayAgo() {
      return this.subtractDay(Date.now())
    },
    agentModified() {
      return {
        ...this.agent,
        labels: this.agent.labels.slice().sort((labelA, labelB) => {
          if (labelA.toLowerCase() < labelB.toLowerCase()) {
            return -1
          } else if (labelA.toLowerCase() > labelB.toLowerCase()) {
            return 1
          } else {
            return 0
          }
        })
      }
    },

    name() {
      return this.agent?.name && this.agent.name !== 'agent'
        ? this.agent.name
        : AGENT_TYPES.find(a => a.type == this.agent?.type)?.name || 'Agent'
    },
    secondsSinceLastQuery() {
      return moment(this.currentDateTime).diff(
        moment(this.agent.last_queried),
        'seconds'
      )
    },
    status() {
      if (this.agent.status === 'old') return 'old'
      if (this.hasFailedRuns()?.length) return 'failed'
      if (this.lateRuns?.length) return 'late'
      if (this.secondsSinceLastQuery < 60 * this.staleThreshold)
        return 'healthy'
      if (this.secondsSinceLastQuery < 60 * this.unhealthyThreshold)
        return 'stale'

      return 'unhealthy'
    },
    statusColor() {
      const color =
        {
          old: 'Gray',
          failed: 'error',
          late: 'deepRed',
          healthy: 'green',
          stale: 'warning',
          unhealthy: 'error'
        }[this.status] || 'secondaryGray'
      return color
    },
    queryColor() {
      if (this.secondsSinceLastQuery < 60 * this.staleThreshold)
        return 'success'
      if (this.secondsSinceLastQuery < 60 * this.unhealthyThreshold)
        return 'warning'

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
      if (!this.submittable) return null
      const filtered = this.submittable?.filter(run => {
        return this.getTimeOverdue(run.scheduled_start_time) <= 20000
      })
      return filtered
    },
    lateRuns() {
      if (!this.submittable?.length) return null
      return this.submittable?.filter(run => {
        return this.getTimeOverdue(run.scheduled_start_time) > 20000
      })
    }
    // labelsAlign() {
    //   if (
    //     !this.agent?.labels?.length &&
    //     this.flowRuns?.every(flowRun => flowRun?.labels?.length > 0)
    //   ) {
    //     return false
    //   } else {
    //     if (this.flowRuns?.length) {
    //       this.flowRuns.forEach(flowRun => {
    //         if (
    //           flowRun?.labels.every(label =>
    //             this.agent?.labels?.includes(label)
    //           )
    //         ) {
    //           this.addMatchingflowRun(flowRun)
    //         }
    //       })
    //     }
    //     return true
    //   }
    // }
  },
  watch: {
    statusColor() {
      this.showIcon = false
      this.$nextTick(() => {
        this.showIcon = true
      })
    },
    submittable(val) {
      if (!val) return
      if (this.lateRuns?.length > 0) {
        this.newStatus = 'late'
        this.tab = 'late'
      }
      if (this.lateRuns?.length <= 0) {
        this.tab = 'submittable'
      }
    },
    // flowRuns() {
    //   this.submittable = []
    //   this.labelsAlign
    // },
    secondsSinceLastQuery(newVal, oldVal) {
      if (newVal > oldVal || !this.agent?.last_queried) return

      this.showLastQuery = false

      setTimeout(() => {
        this.showLastQuery = true
      }, 150) // should match fade transition duration
    }
  },
  mounted() {
    this.interval = setInterval(() => {
      this.currentDateTime = moment().format()
    }, 1000)
  },
  beforeDestroy() {
    clearInterval(this.interval)
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    getTimeOverdue(time) {
      return new Date() - new Date(time)
    },
    agentIcon(type) {
      return AGENT_TYPES.find(a => a.type == type)?.icon || 'fad fa-globe'
    },
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
    },
    addMatchingflowRun(flowRun) {
      const matching = this.submittable?.filter(item => item.id === flowRun.id)
      if (!matching?.length) this.submittable.push(flowRun)
    },
    hasFailedRuns() {
      const badRuns = this.LastRuns?.filter(
        run => run.agent_id === this.agent?.id
      )
        .slice(0, 10)
        .filter(run => ['Failed', 'TriggerFailed'].includes(run.state))

      this.failedRuns = badRuns

      return badRuns
    }
  },
  apollo: {
    // flowRuns: {
    //   query: require('@/graphql/Agent/FlowRuns.gql'),
    //   loadingKey: 'loading',
    //   update: data => {
    //     return data.flow_run
    //   }
    // },
    LastRuns: {
      query: require('@/graphql/Agent/recent-runs.gql'),
      loadingKey: 'loadingKey',
      variables() {
        return {
          day: this.dayAgo
        }
      },
      update: data => {
        console.log('last runs', data)
        return data.flow_run
      }
    }
  }
}
</script>

<template>
  <v-card
    :disabled="agent.isDeleting || isDeleting"
    class="agent-card px-2"
    style="overflow-y: auto;"
    :tile="showAll"
    :height="showAll ? '380px' : '320px'"
  >
    <v-system-bar :color="statusColor" :height="5" absolute> </v-system-bar>

    <div>
      <v-list-item dense class="px-0">
        <v-list-item-avatar class="mr-2" tile>
          <v-icon v-if="showIcon" :color="statusColor" class="fa-2x pi-2x">
            {{ agentIcon(agent.type) || 'fas fa-robot' }}
          </v-icon>
          <v-icon
            v-if="status === 'old' || status === 'healthy'"
            :color="statusColor"
            class="fa-2x pi-2x"
          >
            {{ agentIcon(agent.type) || 'fas fa-robot' }}
          </v-icon>
        </v-list-item-avatar>
        <v-list-item-content class="position: relative;">
          <v-list-item-title class="text-h6">
            <div>
              <div>
                {{ name }}
              </div>
            </div>
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-divider class="ml-12 mr-2"></v-divider>
    </div>

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

    <v-card-text class="py-0">
      <v-list>
        <v-list-item :style="{ 'min-height': '45px' }" two-line class="pa-0">
          <v-list-item-content class="pa-0">
            <v-list-item-title
              ><v-icon
                small
                class="mr-1"
                :color="lateRuns && lateRuns.length ? 'deepRed' : 'success'"
                >adjust</v-icon
              >{{
                lateRuns && lateRuns.length ? 'Late Submittable' : 'Submittable'
              }}
              Runs</v-list-item-title
            >
            <v-list-item-subtitle>
              <span v-if="lateRuns && lateRuns.length">
                {{ lateRuns ? lateRuns.length : 0 }}</span
              >
              <span v-else>
                {{ submittableRuns ? submittableRuns.length : 0 }}</span
              >
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :style="{ 'min-height': '45px' }" two-line class="pa-0">
          <v-list-item-content min-height="10px" class="pa-0">
            <v-list-item-title
              ><v-icon small class="mr-1" :color="queryColor">adjust</v-icon
              >Last Query
            </v-list-item-title>
            <v-list-item-subtitle>
              <span class="font-weight-bold">{{
                agent.last_queried | formatDateTime
              }}</span>
              <span v-if="agent.last_queried">|</span>
              {{ timer }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          v-if="showAll"
          :style="{ 'min-height': '45px' }"
          two-line
          class="pa-0"
        >
          <v-list-item-content class="pa-0">
            <v-list-item-title>Core Version</v-list-item-title>
            <v-list-item-subtitle>
              {{ agent.core_version || 'Unknown' }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          v-if="!showAll"
          :style="{ 'min-height': '45px' }"
          two-line
          class="pa-0"
        >
          <v-list-item-content class="py-0 pt-1">
            <v-list-item-title
              ><v-icon
                small
                class="mr-1"
                :color="
                  lateRuns && lateRuns.length
                    ? 'grey'
                    : hasFailedRuns() && hasFailedRuns().length
                    ? 'error'
                    : 'success'
                "
                >adjust</v-icon
              >Last Runs</v-list-item-title
            >
            <v-list-item-subtitle>
              <LastTenRuns
                :agent-id="agent.id"
                :fake-load="!!lateRuns && !!lateRuns.length"
              />
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          v-if="showAll"
          :style="{ 'min-height': '45px' }"
          two-line
          class="pa-0"
        >
          <v-list-item-content class="pa-0">
            <v-list-item-title>Created</v-list-item-title>
            <v-list-item-subtitle>
              {{ agent.created || 'Unknown' }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          v-if="showAll"
          :style="{ 'min-height': '45px' }"
          two-line
          class="pa-0"
        >
          <v-list-item-content class="pa-0">
            <v-list-item-title>Token</v-list-item-title>
            <v-list-item-subtitle>
              <v-tooltip top>
                <template #activator="{ on }">
                  <div
                    class="text-truncate"
                    :class="{
                      pointer: agent.token_name,
                      'bg-gray-transition': copiedText[agent.token_id],
                      'bg-white-transition': !copiedText[agent.token_id]
                    }"
                    v-on="on"
                    @click="copyTextToClipboard(agent.token_id)"
                  >
                    <span v-if="$vuetify.breakpoint.smAndUp" v-on="on">
                      {{ agent.token_name }}
                    </span>
                  </div>
                </template>

                <span>
                  <v-icon
                    v-if="agent.token_name && agent.token_id"
                    x-small
                    class="mb-2px mr-2"
                    tabindex="0"
                    color="white"
                  >
                    {{ copiedText[agent.token_id] ? 'check' : 'file_copy' }}
                  </v-icon>
                  {{
                    agent.token_name
                      ? 'Click to copy token id'
                      : 'No token name found; you may have registered the agent with an older version of Prefect Core.'
                  }}</span
                >
              </v-tooltip>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item
          v-if="showAll"
          :style="{ 'min-height': '45px' }"
          class="pa-0"
        >
          <v-list-item-content min-height="45px" class="pa-0">
            <v-list-item-title>Agent Id</v-list-item-title>
            <v-list-item-subtitle>
              <v-tooltip bottom>
                <template #activator="{ on }">
                  <span
                    class="cursor-pointer show-icon-hover-focus-only pa-2px"
                    role="button"
                    @click="copyTextToClipboard(agent.id)"
                    v-on="on"
                  >
                    <v-icon x-small class="mb-2px mr-2" tabindex="0">
                      {{ copiedText[agent.id] ? 'check' : 'file_copy' }}
                    </v-icon>
                    {{ agent.id || 'Unknown' }}
                  </span>
                </template>
                <span>
                  {{ agent.id || 'Unknown' }}
                </span>
              </v-tooltip>
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item class="pa-0 mt-2">
          <v-list-item-content class="pa-0">
            <v-list-item-title>
              Labels
            </v-list-item-title>
            <v-sheet
              :height="showAll ? '80px' : '40px'"
              :style="{ overflow: 'auto' }"
            >
              <Label
                v-for="label in agentModified.labels"
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
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-card-actions v-if="!showAll" class="pa-0">
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
        v-show="status !== 'healthy'"
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
