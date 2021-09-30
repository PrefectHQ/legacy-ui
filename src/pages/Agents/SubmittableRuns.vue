<script>
import { mapGetters, mapMutations } from 'vuex'
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import { cancelLateRunsMixin } from '@/mixins/cancelLateRunsMixin'
import { runFlowNowMixin } from '@/mixins/runFlowNow'
import { formatTime } from '@/mixins/formatTimeMixin'
import Alert from '@/components/Alert'
import ClearLate from '@/components/SystemActions/ClearLate'
import WorkQueue from '@/components/SystemActions/WorkQueue'

export default {
  components: {
    CardTitle,
    DurationSpan,
    Alert,
    ClearLate,
    WorkQueue
  },
  mixins: [cancelLateRunsMixin, runFlowNowMixin, formatTime],
  props: {
    rawAgent: {
      type: Object,
      required: true
    }
  },
  data() {
    const tabs = {
      submittable: 0,
      late: 1
    }

    return {
      tab: tabs.submittable,
      tabs,
      overlay: null,
      userSetTab: false,
      loadingKey: 0
    }
  },
  computed: {
    ...mapGetters('agent', [
      'staleThreshold',
      'unhealthyThreshold',
      'sortedAgents'
    ]),
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    ...mapGetters('data', ['flows']),
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
    paused() {
      return this.tenant?.settings?.work_queue_paused
    },
    lateRuns() {
      if (!this.agent.lateRuns) return []
      return [...this.agent.lateRuns].sort(
        (a, b) =>
          new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time)
      )
    },
    loading() {
      return this.loadingKey > 0
    },
    submittableRuns() {
      if (!this.agent.submittableRuns) return []
      return [...this.agent?.submittableRuns].sort(
        (a, b) =>
          new Date(a.scheduled_start_time) - new Date(b.scheduled_start_time)
      )
    },
    title() {
      return this.tabProperties[this.tab].title
    },
    titleIcon() {
      return this.tabProperties[this.tab].icon
    },
    titleIconColor() {
      if (this.loading) return 'grey'

      return this.tabProperties[this.tab].icon_color
    },
    systemBarColor() {
      if (this.loading) return 'secondaryGray'

      return this.lateRuns?.length > 0 ? 'deepRed' : 'Success'
    },
    tabProperties() {
      const submittableCount = this.submittableRuns?.length || 0
      const lateCount = this.lateRuns?.length || 0

      return {
        [this.tabs.submittable]: {
          title: `${this.getFriendlyCount(submittableCount)} submittable runs`,
          icon: 'access_time',
          icon_color: 'primary'
        },
        [this.tabs.late]: {
          title: `${this.getFriendlyCount(lateCount)} late runs`,
          icon: 'timelapse',
          icon_color: lateCount > 0 ? 'deepRed' : 'Success'
        }
      }
    },
    submittableTabTitle() {
      const submittableCount = this.submittableRuns?.length || 0

      if (this.tab == this.tabs.submittable || submittableCount == 0) {
        return 'Submittable'
      }

      return `(${this.getFriendlyCount(submittableCount)}) Submittable`
    },
    lateTabTitle() {
      const lateCount = this.lateRuns?.length || 0

      if (this.tab == this.tabs.late || lateCount == 0) {
        return 'Late'
      }

      return `(${this.getFriendlyCount(lateCount)}) Late`
    }
  },
  watch: {
    agent(val) {
      if (!val || this.userSetTab) return

      if (this.tab == this.tabs.submittable && this.lateRuns?.length > 0) {
        this.tab = this.tabs.late
      } else if (this.tab == this.tabs.late && this.lateRuns?.length == 0) {
        this.tab = this.tabs.submittable
      }
    },
    ['tenant.settings.work_queue_paused'](val) {
      if (!val) {
        setTimeout(() => {
          this.hideOverlay()
        }, 1500)
      }
    }
  },
  mounted() {
    if (this.agent?.lateRuns?.length) this.tab = this.tabs.late
  },
  methods: {
    ...mapMutations('agent', ['setRefetch']),
    flowName(flowRun) {
      const flow = this.flows?.filter(flow => flow?.id === flowRun.flow_id)[0]
      return flow?.name
    },
    flowRunName(flowRun) {
      return flowRun?.name
    },
    showOverlay(kind) {
      this.overlay = kind
    },
    hideOverlay() {
      this.overlay = null
    },
    refetch() {
      this.setRefetch(true)
      this.overlay = null
    },
    getFriendlyCount(count) {
      return count > 999 ? '1,000+' : count
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Agent/FlowRuns.gql'),
      pollInterval: 1000,
      loadingKey: 'loadingKey',
      update(data) {
        return data.flow_run
      }
    }
  }
}
</script>

<template>
  <v-card class="py-2" tile height="380px">
    <v-system-bar :color="systemBarColor" :height="5" absolute />

    <CardTitle :title="title" :icon="titleIcon" :icon-color="titleIconColor">
      <v-row slot="title" no-gutters class="d-flex align-center">
        <v-col cols="10">
          <div>
            <div
              v-if="loading || (tab === tabs.late && isClearingLateRuns)"
              style="
                display: inline-block;
                height: 20px;
                overflow: hidden;
                width: 20px;"
            >
              <v-skeleton-loader type="avatar" tile />
            </div>
            {{ title }}
          </div>
        </v-col>
      </v-row>
    </CardTitle>

    <v-tabs
      v-model="tab"
      tabs-border-bottom
      :color="titleIconColor"
      class="flex-grow-0"
      @change="userSetTab = true"
    >
      <v-tab :key="tabs.submittable" data-cy="submittable-runs-submittable">
        {{ submittableTabTitle }}
      </v-tab>
      <v-tab :key="tabs.late" data-cy="submittable-runs-late">
        <v-icon v-if="lateRuns && lateRuns.length > 0" small color="deepRed">
          warning
        </v-icon>
        {{ lateTabTitle }}
      </v-tab>
    </v-tabs>

    <v-card-text v-show="overlay" class="pa-0">
      <v-overlay v-show="overlay == 'late'" absolute z-index="1">
        <ClearLate :flow-runs="lateRuns" @finish="refetch" />
      </v-overlay>
      <v-overlay v-show="overlay == 'queue'" absolute z-index="1">
        <WorkQueue />
      </v-overlay>
    </v-card-text>

    <v-tabs-items v-model="tab" class="flex-grow-1">
      <v-tab-item :key="tabs.submittable">
        <v-card-text
          class="pa-0"
          :class="
            lateRuns && lateRuns.length ? 'late-card-content' : 'card-content'
          "
        >
          <v-skeleton-loader v-if="loading" type="list-item-three-line" />

          <v-list-item
            v-else-if="submittableRuns && submittableRuns.length === 0"
            dense
          >
            <v-list-item-avatar class="mr-0">
              <v-icon class="green--text">check</v-icon>
            </v-list-item-avatar>
            <v-list-item-content class="my-0 py-0">
              <div
                class="text-subtitle-1 font-weight-light"
                style="line-height: 1.25rem;"
              >
                No submittable runs.
              </div>
            </v-list-item-content>
          </v-list-item>

          <v-list v-else dense>
            <v-lazy
              v-for="item in submittableRuns"
              :key="item.id"
              :options="{
                threshold: 0.75
              }"
              min-height="44"
              transition="fade-transition"
            >
              <v-list-item dense :disabled="setToRun.includes(item.id)">
                <v-list-item-content>
                  <v-list-item-subtitle class="text-body-1 font-weight-regular">
                    <router-link
                      :to="{ name: 'flow', params: { id: item.flow_id } }"
                    >
                      {{ flowName(item) }}
                    </router-link>
                    <span class="font-weight-bold">
                      <v-icon style="font-size: 12px;">
                        chevron_right
                      </v-icon>
                    </span>
                    <router-link
                      :to="{ name: 'flow-run', params: { id: item.id } }"
                    >
                      {{ item.name }}
                    </router-link>
                  </v-list-item-subtitle>

                  <span class="text-caption mb-0 ml-n1 d-flex align-center">
                    <span class="ml-1">
                      Scheduled for
                      {{ formatDateTime(item.scheduled_start_time) }}
                    </span>
                  </span>
                </v-list-item-content>

                <v-list-item-action tile min-width="5" class="text-body-2">
                  <v-tooltip top>
                    <template #activator="{ on }">
                      <v-btn
                        text
                        x-small
                        aria-label="Run Now"
                        :disabled="setToRun.includes(item.id)"
                        color="primary"
                        class="vertical-button"
                        v-on="on"
                        @click="runFlowNow(item.id, item.version, item.name)"
                      >
                        <v-icon small dense color="primary"> fa-rocket</v-icon>
                      </v-btn>
                    </template>
                    <span> Run {{ item.name }} now </span>
                  </v-tooltip>
                </v-list-item-action>
              </v-list-item>
            </v-lazy>
          </v-list>

          <Alert
            v-model="showAlert"
            :type="alertType"
            :message="alertMessage"
            :alert-link="alertLink"
            :timeout="12000"
          >
          </Alert>
        </v-card-text>
      </v-tab-item>

      <v-tab-item :key="tabs.late">
        <v-card-text
          class="pa-0"
          :class="
            lateRuns && lateRuns.length ? 'late-card-content' : 'card-content'
          "
        >
          <v-skeleton-loader
            v-if="loading || isClearingLateRuns"
            type="list-item-three-line"
          />

          <v-list-item v-else-if="lateRuns && lateRuns.length === 0" dense>
            <v-list-item-avatar class="mr-0">
              <v-icon class="green--text">check</v-icon>
            </v-list-item-avatar>
            <v-list-item-content class="my-0 py-0">
              <div
                class="text-subtitle-1 font-weight-light"
                style="line-height: 1.25rem;"
              >
                Everything is running on schedule!
              </div>
            </v-list-item-content>
          </v-list-item>

          <v-list v-else dense>
            <v-lazy
              v-for="item in lateRuns"
              :key="item.id"
              :options="{
                threshold: 0.75
              }"
              min-height="40px"
              transition="fade"
            >
              <v-list-item dense three-line>
                <v-list-item-content>
                  <v-list-item-subtitle class="text-body-1 font-weight-regular">
                    <router-link
                      :to="{ name: 'flow', params: { id: item.flow_id } }"
                    >
                      {{ flowName(item) }}
                    </router-link>
                    <span class="font-weight-bold">
                      <v-icon style="font-size: 12px;">
                        chevron_right
                      </v-icon>
                    </span>
                    <router-link
                      :to="{ name: 'flow-run', params: { id: item.id } }"
                    >
                      {{ item.name }}
                    </router-link>
                  </v-list-item-subtitle>

                  <span class="text-caption mb-0 ml-n1 d-flex align-center">
                    <span class="ml-1">
                      Scheduled for
                      {{ formatDateTime(item.scheduled_start_time) }}
                    </span>
                  </span>

                  <v-list-item-subtitle class="text-caption">
                    <DurationSpan :start-time="item.scheduled_start_time" />
                    behind schedule
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-lazy>
          </v-list>
        </v-card-text>
      </v-tab-item>
    </v-tabs-items>

    <v-card-actions class="pb-0">
      <v-spacer />
      <v-btn
        v-if="!overlay && lateRuns && lateRuns.length > 0"
        small
        depressed
        color="primary"
        text
        style="z-index: 2;"
        @click="showOverlay('late')"
      >
        Clear late
      </v-btn>

      <v-btn
        v-if="overlay && !paused"
        small
        depressed
        plain
        color="white"
        width="74"
        text
        style="z-index: 2;"
        @click="hideOverlay"
      >
        Close
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
a {
  text-decoration: none !important;
}

.button-transition {
  transition: border-right 150ms linear;
}

.w-100 {
  width: 100% !important;
}

.late-card-content {
  min-height: calc(280px - var(--v-tabs-height));
  max-height: calc(280px - var(--v-tabs-height));
  overflow-y: auto;
}

.card-content {
  min-height: calc(300px - var(--v-tabs-height));
  max-height: calc(300px - var(--v-tabs-height));
  overflow-y: auto;
}
</style>
