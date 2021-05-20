<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'

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
  // filters: {
  //   formatDateTime(value) {
  //     if (!value) return 'None'
  //     return moment(value).format('h:mma z')
  //   }
  // },
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
      // currentDateTime: moment().format(),
      labelMenuOpen: false,
      // interval: null,
      isDeleting: false,
      showConfirmDialog: false,
      // showLastQuery: true,
      submittable: this.agent.submittableRuns,
      // newStatus: '',
      showIcon: true
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
    hasLateRuns() {
      return !!this.lateRuns?.length
    },
    // agentModified() {
    //   return {
    //     ...this.agent,
    //     labels: this.agent.labels.slice().sort((labelA, labelB) => {
    //       if (labelA.toLowerCase() < labelB.toLowerCase()) {
    //         return -1
    //       } else if (labelA.toLowerCase() > labelB.toLowerCase()) {
    //         return 1
    //       } else {
    //         return 0
    //       }
    //     })
    //   }
    // },

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
      // if (!this.agent?.submittableRuns) return null
      // const filtered = this.agent?.submittableRuns?.filter(run => {
      //   return this.getTimeOverdue(run.scheduled_start_time) <= 20000
      // })
      // return filtered
      return this.agent.submittableRuns
    },
    lateRuns() {
      return this.agent.lateRuns
      // if (!this.agent?.submittableRuns?.length) return null
      // return this.agent?.submittableRuns?.filter(run => {
      //   return this.getTimeOverdue(run.scheduled_start_time) > 20000
      // })
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
    statusColor(val) {
      //make sure icon color updates
      console.log('statusColor', val)
      this.showIcon = false
      setTimeout(() => {
        this.showIcon = true
      }, 150)
    }
    // agent() {
    //   console.log('agent', this.agent)
    //   if (this.hasLateRuns) {
    //     this.agent.status === 'late'
    //   }
    // }
    // submittable(val) {
    //   if (!val) return
    //   if (this.lateRuns?.length > 0) {
    //     this.tab = 'late'
    //   }
    //   if (this.hasLateRuns <= 0) {
    //     this.tab = 'submittable'
    //   }
    // }
  },
  // flowRuns() {
  //   this.submittable = []
  //   this.labelsAlign
  // },
  //   secondsSinceLastQuery(newVal, oldVal) {
  //     if (newVal > oldVal || !this.agent?.last_queried) return

  //     this.showLastQuery = false

  //     setTimeout(() => {
  //       this.showLastQuery = true
  //     }, 150) // should match fade transition duration
  //   }
  // },
  // mounted() {
  //   this.interval = setInterval(() => {
  //     this.currentDateTime = moment().format()
  //   }, 1000)
  // },
  // beforeDestroy() {
  //   clearInterval(this.interval)
  // },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapMutations('agent', ['setRefetch']),
    // getTimeOverdue(time) {
    //   return new Date() - new Date(time)
    // },
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
    // addMatchingflowRun(flowRun) {
    //   const matching = this.submittable?.filter(item => item.id === flowRun.id)
    //   if (!matching?.length) this.submittable.push(flowRun)
    // },
  },
  apollo: {
    // flowRuns: {
    //   query: require('@/graphql/Agent/FlowRuns.gql'),
    //   loadingKey: 'loading',
    //   update: data => {
    //     return data.flow_run
    //   }
    // },
    recentRuns: {
      query: require('@/graphql/Agent/recent-runs.gql'),
      loadingKey: 'loadingKey',
      variables() {
        return {
          agentId: this.agent.id,
          day: this.dayAgo
        }
      },
      // skip() {
      //   return this.agent.status === 'old'
      // },
      update: data => {
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
    :height="showAll ? '380px' : '300px'"
  >
    <v-card-title>
      <v-system-bar :color="statusColor" :height="5" absolute> </v-system-bar>

      <div>
        <v-icon :color="statusColor" class="fa-2x pi-2x">
          {{ agentIcon || 'fas fa-robot' }}
        </v-icon>
        <span class="ml-2">{{ name }}</span>
      </div>
    </v-card-title>
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
      <div v-if="!showAll || hasLateRuns" class="my-2">
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
      <div class="my-2">
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

      <div v-if="showAll" class="my-2">
        Core Version:
        {{ agent.core_version || 'Unknown' }}
      </div>
      <div v-if="!showAll" :style="{ 'min-height': '45px' }" class="pa-0">
        <v-icon
          small
          class="mr-1"
          :color="
            hasLateRuns
              ? 'grey'
              : failedRuns
              ? 'error'
              : recentRuns && recentRuns.length
              ? 'success'
              : 'grey'
          "
          >adjust</v-icon
        >Recent Runs
        <LastTenRuns
          :runs="recentRuns"
          :agent-id="agent.id"
          :disable-view="hasLateRuns"
        />
      </div>
      <div v-if="showAll" class="my-2">
        Created at {{ formatDateTime(agent.created) || 'Unknown' }}
      </div>

      <div v-if="showAll" class="my-2">
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

      <div v-if="showAll" class="my-2">
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
      <v-list>
        <v-list-item class="pa-0 mt-2">
          <v-list-item-content class="pa-0">
            <v-list-item-title>
              Labels
            </v-list-item-title>
            <v-sheet
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
