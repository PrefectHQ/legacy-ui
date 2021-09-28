<script>
import { mapGetters } from 'vuex'
import CardTitle from '@/components/Card-Title'
import ClearLate from '@/components/SystemActions/ClearLate'
import ConcurrencyInfo from '@/components/ConcurrencyInfo'
import WorkQueue from '@/components/SystemActions/WorkQueue'
import UpcomingRunsTileUpcoming from './UpcomingRuns-Tile-Upcoming.vue'
import UpcomingRunsTileLate from './UpcomingRuns-Tile-Late.vue'

export default {
  components: {
    CardTitle,
    ClearLate,
    ConcurrencyInfo,
    WorkQueue,
    UpcomingRunsTileUpcoming,
    UpcomingRunsTileLate
  },
  props: {
    aggregate: {
      type: Boolean,
      default: () => false
    },
    flow: {
      type: Object,
      default: () => {}
    },
    flowGroup: {
      type: Object,
      default: () => {}
    },
    fullHeight: {
      required: false,
      type: Boolean,
      default: () => false
    }
  },
  data() {
    const tabs = {
      upcoming: 'upcoming',
      late: 'late'
    }

    return {
      lateInterval: null,
      loadingKey: 0,
      overlay: null,
      tab: tabs.upcoming,
      tabs
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['timezone']),
    loading() {
      return this.loadingKey > 0
    },
    paused() {
      return this.tenant?.settings?.work_queue_paused
    },
    lateRuns() {
      if (!this.upcomingFowRunsData) return null

      return this.upcomingFowRunsData.filter(run => this.runIsLate(run))
    },
    upcomingRuns() {
      if (!this.upcomingFowRunsData) return null

      return this.upcomingFowRunsData.filter(run => !this.runIsLate(run))
    },
    title() {
      if (!this.upcomingFowRunsData) return null

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
      if (this.loading || !this.upcomingFowRunsData) return 'secondaryGray'

      return this.lateRuns?.length > 0 ? 'deepRed' : 'Success'
    },
    tabProperties() {
      var upcomingCount = this.upcomingRuns?.length || 0
      var lateCount = this.lateRuns?.length || 0

      return {
        [this.tabs.upcoming]: {
          title: `${upcomingCount} upcoming runs`,
          icon: 'access_time',
          icon_color: 'primary'
        },
        [this.tabs.late]: {
          title: `${lateCount > 999 ? '1,000+' : lateCount} late runs`,
          icon: 'timelapse',
          icon_color: lateCount > 0 ? 'deepRed' : 'Success'
        }
      }
    }
  },
  watch: {
    ['tenant.settings.work_queue_paused'](val) {
      if (!val) {
        setTimeout(() => {
          this.hideOverlay()
        }, 1500)
      }
    }
  },
  beforeDestroy() {
    this.upcomingFowRunsData = []
    clearInterval(this.lateInterval)
    this.tab = this.tabs.upcoming
  },
  mounted() {
    if (this.paused) {
      this.showOverlay('queue')
    }

    this.lateInterval = setInterval(() => {
      // This ensures that the lateRuns always recomputes
      // even if the upcoming runs don't return new data
      this.upcomingFowRunsData = [...this.upcomingFowRunsData]
    }, 10000)
  },
  methods: {
    runIsLate(run) {
      return this.getTimeOverdue(run.scheduled_start_time) > 20000
    },
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
      this.$apollo.queries.upcomingFowRunsData.refresh()
      this.overlay = null
    }
  },
  apollo: {
    upcomingFowRunsData: {
      query: require('@/graphql/Flow/upcoming-flow-runs.gql'),
      variables() {
        let variables = {}

        if (this.aggregate) {
          variables.flow_group_id = this.flow.flow_group_id
        } else {
          variables.flow_id = this.flow.id
        }

        return variables
      },
      loadingKey: 'loadingKey',
      pollInterval: 10000,
      fetchPolicy: 'no-cache',
      update: data => data?.flow_run || []
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
    <v-system-bar :color="systemBarColor" :height="5" absolute />

    <CardTitle :title="title" :icon="titleIcon" :icon-color="titleIconColor">
      <v-row slot="title" no-gutters class="d-flex align-center">
        <v-col cols="8">
          <div>
            <div
              v-if="loading"
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
          <ConcurrencyInfo
            v-if="isCloud && tab === tabs.late"
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
          :color="tab == tabs.upcoming ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'upcoming'
                ? 'var(--v-primary-base)'
                : 'var(--v-appForeground-base)'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = tabs.upcoming"
        >
          {{
            upcomingRuns && upcomingRuns.length > 0 && tab === tabs.late
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
          :color="tab == tabs.late ? 'primary' : ''"
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
          @click="tab = tabs.late"
        >
          <v-icon v-if="lateRuns && lateRuns.length > 0" small color="deepRed">
            warning
          </v-icon>
          {{
            lateRuns && lateRuns.length > 0 && tab === tabs.upcoming
              ? `(${lateRuns.length})`
              : ''
          }}
          Late
          <v-icon small>timelapse</v-icon>
        </v-btn>
      </div>
    </CardTitle>

    <v-card-text v-show="overlay" class="pa-0">
      <v-overlay v-show="overlay == tabs.late" absolute z-index="1">
        <ClearLate :flow-runs="lateRuns" @finish="refetch" />
      </v-overlay>
      <v-overlay v-show="overlay == 'queue'" absolute z-index="1">
        <WorkQueue />
      </v-overlay>
    </v-card-text>

    <upcoming-runs-tile-upcoming
      v-show="tab == tabs.upcoming"
      :loading="loading"
      :runs="upcomingRuns"
    />

    <upcoming-runs-tile-late
      v-show="tab == tabs.late"
      :loading="loading"
      :runs="lateRuns"
    />

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
        @click="showOverlay(tabs.late)"
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

.card-content {
  height: 100%;
  max-height: 226px;
  overflow-y: auto;
  position: relative;
}
</style>
