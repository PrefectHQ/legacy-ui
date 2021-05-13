<script>
// import moment from 'moment-timezone'
import { mapGetters } from 'vuex'
import CardTitle from '@/components/Card-Title'
import ClearLate from '@/components/SystemActions/ClearLate'
import ConcurrencyInfo from '@/components/ConcurrencyInfo'
import DurationSpan from '@/components/DurationSpan'
import LabelWarning from '@/components/LabelWarning'
import WorkQueue from '@/components/SystemActions/WorkQueue'

import { runFlowNowMixin } from '@/mixins/runFlowNow'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    CardTitle,
    ClearLate,
    ConcurrencyInfo,
    DurationSpan,
    LabelWarning,
    WorkQueue
  },
  mixins: [runFlowNowMixin, formatTime],
  props: {
    projectId: {
      required: false,
      type: String,
      default: () => null
    },
    fullHeight: {
      required: false,
      type: Boolean,
      default: () => false
    }
  },
  data() {
    return {
      lateInterval: null,
      loadingKey: 0,
      overlay: null,
      tab: 'upcoming'
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    lateRuns() {
      if (!this.upcoming) return null
      return this.upcoming.filter(run => {
        return this.getTimeOverdue(run.scheduled_start_time) > 20000
      })
    },
    loading() {
      return this.loadingKey > 0
    },
    paused() {
      return this.tenant?.settings?.work_queue_paused
    },
    upcomingRuns() {
      if (!this.upcoming) return null
      return this.upcoming.filter(run => {
        return this.getTimeOverdue(run.scheduled_start_time) <= 20000
      })
    },
    title() {
      if (!this.upcoming) return
      let title = ''

      if (this.tab == 'upcoming') {
        title =
          this.loading > 0
            ? 'Upcoming runs'
            : `${this.upcomingRuns?.length || 0} upcoming runs`
      }

      if (this.tab == 'late') {
        title = this.loading
          ? 'Late runs'
          : `${this.lateRuns?.length || 0} late runs`
      }

      return title
    },
    titleIcon() {
      let icon = ''

      if (this.tab == 'upcoming') {
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
        : this.tab == 'upcoming'
        ? 'primary'
        : this.lateRuns?.length > 0
        ? 'deepRed'
        : 'Success'
    }
  },
  watch: {
    upcoming(val) {
      if (!val) return
      if (this.lateRuns?.length > 0) {
        this.tab = 'late'
      }
      if (this.lateRuns?.length <= 0) {
        this.tab = 'upcoming'
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
  beforeDestroy() {
    this.upcoming = []
    clearInterval(this.lateInterval)
    this.tab = 'upcoming'
  },
  mounted() {
    if (this.paused) {
      this.showOverlay('queue')
    }

    this.lateInterval = setInterval(() => {
      // This ensures that the lateRuns always recomputes
      // even if the upcoming runs don't return new data
      this.upcoming = [...this.upcoming]
    }, 10000)
  },
  methods: {
    getTimeOverdue(time) {
      return new Date() - new Date(time)
    },
    showOverlay(kind) {
      this.overlay = kind
    },
    hideOverlay() {
      this.overlay = null
    },
    refetch() {
      this.$apollo.queries.upcoming.refresh()
      this.overlay = null
    }
  },
  apollo: {
    upcoming: {
      query: require('@/graphql/Dashboard/upcoming-flow-runs.gql'),
      variables() {
        return {
          projectId: this.projectId ? this.projectId : null
        }
      },
      loadingKey: 'loadingKey',
      pollInterval: 10000,
      fetchPolicy: 'no-cache',
      update: data => data?.flow_run
    }
  }
}
</script>

<template>
  <v-card
    class="py-2 position-relative d-flex flex-column"
    style="height: 100%;"
    tile
  >
    <v-system-bar
      :color="
        loading || !upcoming
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
              v-if="loading || !upcoming"
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
          <ConcurrencyInfo
            v-if="isCloud && tab === 'late'"
            class="text-caption position-absolute"
            style="bottom: 2px;"
          />
        </v-col>
      </v-row>

      <div slot="action" class="d-flex align-end flex-column">
        <v-btn
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'upcoming' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'upcoming'
                ? 'var(--v-primary-base)'
                : 'var(--v-appForeground-base)'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = 'upcoming'"
        >
          {{
            upcomingRuns && upcomingRuns.length > 0 && tab === 'late'
              ? `(${upcomingRuns.length})`
              : ''
          }}
          Upcoming
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
            lateRuns && lateRuns.length > 0 && tab === 'upcoming'
              ? `(${lateRuns.length})`
              : ''
          }}
          Late
          <v-icon small>timelapse</v-icon>
        </v-btn>
      </div>
    </CardTitle>

    <v-card-text v-if="overlay" class="pa-0">
      <v-overlay v-if="overlay == 'late'" absolute z-index="1">
        <ClearLate :flow-runs="lateRuns" @finish="refetch" />
      </v-overlay>
      <v-overlay v-if="overlay == 'queue'" absolute z-index="1">
        <WorkQueue />
      </v-overlay>
    </v-card-text>

    <v-card-text v-if="!overlay && tab == 'upcoming'" class="pa-0 card-content">
      <v-skeleton-loader
        v-if="loading || !upcoming"
        type="list-item-three-line"
      >
      </v-skeleton-loader>

      <v-list-item
        v-else-if="!loading && upcomingRuns && upcomingRuns.length === 0"
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
            No upcoming runs.
          </div>
        </v-list-item-content>
      </v-list-item>

      <v-list v-else dense class="card-content">
        <v-lazy
          v-for="item in upcomingRuns"
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
                <LabelWarning :flow="item.flow" :flow-run="item" />
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
    </v-card-text>

    <v-card-text v-if="!overlay && tab == 'late'" class="pa-0 card-content">
      <v-skeleton-loader v-if="loading" type="list-item-three-line">
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
                <LabelWarning :flow="item.flow" :flow-run="item" />
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
      </v-list>
    </v-card-text>

    <v-spacer />

    <v-card-actions class="py-0">
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
        v-if="!overlay"
        small
        depressed
        color="primary"
        text
        style="z-index: 2;"
        @click="showOverlay('queue')"
      >
        Options
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

.card-content {
  height: 100%;
  max-height: 226px;
  overflow-y: auto;
  position: relative;
}
</style>
