<script>
import { mapGetters } from 'vuex'

import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import ExternalLink from '@/components/ExternalLink'
import { cancelLateRunsMixin } from '@/mixins/cancelLateRunsMixin'
import { runFlowNowMixin } from '@/mixins/runFlowNow'
import { formatTime } from '@/mixins/formatTimeMixin'
import Alert from '@/components/Alert'

export default {
  components: {
    CardTitle,
    DurationSpan,
    ExternalLink,
    Alert
  },
  mixins: [cancelLateRunsMixin, runFlowNowMixin, formatTime],
  props: {
    agent: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      submittable: [],
      loadingKey: 0,
      tab: 'submittable',
      show: true
    }
  },
  computed: {
    ...mapGetters('agent', ['staleThreshold', 'unhealthyThreshold']),
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    lateRuns() {
      if (!this.submittable.length) return null
      return this.submittable?.filter(run => {
        return this.getTimeOverdue(run.scheduled_start_time) > 20000
      })
    },
    loading() {
      return this.loadingKey > 0
    },
    submittableRuns() {
      if (!this.submittable) return null
      const filtered = this.submittable?.filter(run => {
        return this.getTimeOverdue(run.scheduled_start_time) <= 20000
      })
      return filtered
    },
    title() {
      if (!this.submittable) return
      let title = ''

      if (this.tab == 'submittable') {
        title =
          this.loading > 0
            ? 'Submittable runs'
            : `${this.submittableRuns?.length || 0} submittable runs`
      }

      if (this.tab == 'late') {
        title =
          this.loading || this.isClearingLateRuns
            ? 'Late runs'
            : `${this.lateRuns?.length || 0} late runs`
      }

      return title
    },
    titleIcon() {
      let icon = ''

      if (this.tab == 'submittable') {
        icon = 'access_time'
      }

      if (this.tab == 'late') {
        icon = 'timelapse'
      }

      return icon
    },
    titleIconColor() {
      return this.loading
        ? 'grey'
        : this.tab == 'submittable'
        ? 'primary'
        : this.lateRuns?.length > 0
        ? 'deepRed'
        : 'Success'
    },
    labelsAlign() {
      if (!this.flowRuns?.length) {
        this.labelMessage('You have no flowRuns')
        return false
      }
      if (
        !this.agent?.labels?.length &&
        this.flowRuns.every(flowRun => flowRun.labels.length > 0)
      ) {
        this.labelMessage(
          "You have no currently registered flowRuns that match this agent's labels.  You will need to edit your flowRuns' labels"
        )
        return false
      } else {
        let matchingLabels = 0
        if (this.flowRuns) {
          this.flowRuns.forEach(flowRun => {
            if (
              flowRun.labels.every(label => this.agent?.labels?.includes(label))
            ) {
              this.addMatchingflowRun(flowRun)
            }
          })
        }
        if (matchingLabels > 0) {
          return true
        } else {
          return false
        }
      }
    }
  },
  watch: {
    submittable(val) {
      if (!val) return
      if (this.lateRuns?.length > 0) {
        this.tab = 'late'
      }
      if (this.lateRuns?.length <= 0) {
        this.tab = 'submittable'
      }
    },
    flowRuns() {
      this.submittable = []
      this.labelsAlign
    }
  },
  beforeDestroy() {
    this.submittable = []
    this.tab = 'submittable'
  },
  methods: {
    getTimeOverdue(time) {
      return new Date() - new Date(time)
    },
    labelMessage(text) {
      this.labelMessageText = text
    },
    addMatchingflowRun(flowRun) {
      if (!this.submittable.filter(item => item.id === flowRun.id).length)
        this.submittable.push(flowRun)
    },
    flowRunName(flowRun) {
      return flowRun?.name
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Agent/FlowRuns.gql'),
      loadingKey: 'loading',
      update: data => {
        return data.flow_run
      }
    }
  }
}
</script>

<template>
  <v-card
    v-if="labelsAlign || show"
    class="py-2"
    tile
    :style="{ height: '330px' }"
  >
    <v-system-bar
      :color="
        loading || !submittable
          ? 'secondaryGray'
          : lateRuns && lateRuns.length > 0
          ? 'deepRed'
          : 'Success'
      "
      :height="5"
      absolute
    >
    </v-system-bar>

    <CardTitle :title="title" :icon="titleIcon" :icon-color="titleIconColor">
      <v-row slot="title" no-gutters class="d-flex align-center">
        <v-col cols="8">
          <div>
            <div
              v-if="
                loading ||
                  (tab === 'late' && isClearingLateRuns) ||
                  !submittable
              "
              style="
                display: inline-block;
                height: 20px;
                overflow: hidden;
                width: 20px;"
            >
              <v-skeleton-loader type="avatar" tile></v-skeleton-loader>
            </div>
            {{ title }}
          </div>
        </v-col>
      </v-row>

      <div slot="action" class="d-flex align-end flex-column">
        <v-btn
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'submittable' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'submittable'
                ? 'var(--v-primary-base)'
                : 'var(--v-appForeground-base)'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = 'submittable'"
        >
          {{
            submittableRuns && submittableRuns.length > 0 && tab === 'late'
              ? `(${submittableRuns.length})`
              : ''
          }}
          Submittable
          <v-icon small>access_time</v-icon>
        </v-btn>

        <v-btn
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'late' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'late'
                ? lateRuns && lateRuns.length > 0
                  ? 'var(--v-deepRed-base)'
                  : 'var(--v-primary-base)'
                : 'var(--v-appForeground-base)'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = 'late'"
        >
          <v-icon v-if="lateRuns && lateRuns.length > 0" small color="deepRed">
            warning
          </v-icon>
          {{
            lateRuns && lateRuns.length > 0 && tab === 'submittable'
              ? `(${lateRuns.length})`
              : ''
          }}
          Late
          <v-icon small>timelapse</v-icon>
        </v-btn>
      </div>
    </CardTitle>

    <v-card-text v-if="tab == 'submittable'" class="pa-0">
      <v-skeleton-loader
        v-if="loading || !submittable"
        type="list-item-three-line"
      >
      </v-skeleton-loader>

      <v-list-item
        v-else-if="!loading && submittableRuns && submittableRuns.length === 0"
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

      <v-list v-else dense class="card-content">
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
              <span class="text-caption mb-0 ml-n1 d-flex align-end">
                <span class="ml-1">
                  Scheduled for
                  {{ formatDateTime(item.scheduled_start_time) }}
                </span>
              </span>
              <v-list-item-subtitle class="font-weight-light">
                <router-link
                  :to="{ name: 'flow', params: { id: item.flow.id } }"
                >
                  {{ item.flow.name }}
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

      <div
        v-if="submittableRuns && submittableRuns.length > 3"
        class="pa-0 card-footer"
      >
      </div>
    </v-card-text>

    <v-card-text v-if="tab == 'late'" class="pa-0 card-content">
      <v-skeleton-loader
        v-if="loading || isClearingLateRuns"
        type="list-item-three-line"
      >
      </v-skeleton-loader>

      <v-list-item
        v-else-if="!loading && lateRuns && lateRuns.length === 0"
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
            Everything is running on schedule!
          </div>
        </v-list-item-content>
      </v-list-item>

      <v-list v-else dense class="card-content">
        <v-lazy
          v-for="item in lateRuns"
          :key="item.id"
          :options="{
            threshold: 0.75
          }"
          min-height="40px"
          transition="fade"
        >
          <v-list-item
            dense
            three-line
            :to="{ name: 'flow-run', params: { id: item.id } }"
          >
            <v-list-item-content>
              <span class="text-caption mb-0 ml-n1 d-flex align-end">
                <span class="ml-1">
                  Scheduled for
                  {{ formatDateTime(item.scheduled_start_time) }}
                </span>
              </span>

              <v-list-item-title class="text-body-2">
                <router-link
                  :to="{ name: 'flow', params: { id: item.flow.id } }"
                >
                  {{ item.flow.name }}
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
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                <DurationSpan :start-time="item.scheduled_start_time" />
                behind schedule
              </v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-avatar class="text-body-2">
              <v-icon class="grey--text">arrow_right</v-icon>
            </v-list-item-avatar>
          </v-list-item>
        </v-lazy>

        <v-btn
          text
          color="deepRed"
          small
          class="position-absolute"
          :style="{ bottom: '8px', right: '4px' }"
          tile
          :loading="isClearingLateRuns"
          @click="handleOpenDialog"
        >
          Clear
        </v-btn>

        <v-dialog v-model="showClearLateRunsDialog" max-width="480">
          <v-card flat>
            <v-card-title class="text-h6 word-break-normal">
              Are you sure you want to clear all late runs?
            </v-card-title>

            <v-card-text v-if="scheduledRunIds.length > 1">
              This will toggle the schedule for all flows with late runs. If you
              did not set a
              <ExternalLink
                href="https://docs.prefect.io/core/concepts/schedules.html#schedules"
                >start time</ExternalLink
              >
              for your schedule,
              <strong
                >it may affect the scheduled start times for your submittable
                runs.</strong
              >
            </v-card-text>
            <v-card-text v-else>
              This will set your late flow runs into a
              <strong>cancelled</strong> state.
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text tile @click="showClearLateRunsDialog = false">
                Cancel
              </v-btn>
              <v-btn dark color="deepRed" depressed @click="clearLateRuns">
                Confirm
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-list>

      <div v-if="lateRuns && lateRuns.length > 3" class="pa-0 card-footer">
      </div>
    </v-card-text>
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

.card-content {
  max-height: 254px;
  overflow-y: auto;
}

.card-footer {
  background-image: linear-gradient(transparent, 60%, rgba(0, 0, 0, 0.1));
  bottom: 6px;
  height: 6px !important;
  pointer-events: none;
  position: absolute;
  width: 100%;
}
</style>
