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
      upcoming: 0,
      late: 1
    }

    return {
      lateInterval: null,
      loadingKey: 0,
      overlay: null,
      pristine: true,
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
      if (!this.upcomingFlowRunsData) return null

      return this.upcomingFlowRunsData.filter(run => this.runIsLate(run))
    },
    upcomingRuns() {
      if (!this.upcomingFlowRunsData) return null

      return this.upcomingFlowRunsData.filter(run => !this.runIsLate(run))
    },
    title() {
      if (!this.upcomingFlowRunsData) return null

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
      if (this.loading || !this.upcomingFlowRunsData) return 'secondaryGray'

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
    upcomingFlowRunsData(val) {
      if (!val || !this.pristine) return

      if (this.tab == this.tabs.upcoming && this.lateRuns?.length > 0) {
        this.tab = this.tabs.late
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
    this.upcomingFlowRunsData = []
    clearInterval(this.lateInterval)
    this.tab = this.tabs.upcoming
  },
  mounted() {
    if (this.paused) {
      this.showOverlay('queue')
    }
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
      this.$apollo.queries.upcomingFlowRunsData.refresh()
      this.overlay = null
    }
  },
  apollo: {
    upcomingFlowRunsData: {
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
      update: data => {
        return (data?.flow_run || []).map(run => ({
          ...run,
          cacheInvalidation: new Date().getTime()
        }))
      }
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
    </CardTitle>

    <v-card-text v-show="overlay" class="pa-0">
      <v-overlay v-show="overlay == tabs.late" absolute z-index="1">
        <ClearLate :flow-runs="lateRuns" @finish="refetch" />
      </v-overlay>
      <v-overlay v-show="overlay == 'queue'" absolute z-index="1">
        <WorkQueue />
      </v-overlay>
    </v-card-text>

    <v-tabs
      v-model="tab"
      tabs-border-bottom
      :color="titleIconColor"
      class="flex-grow-0"
      @change="pristine = false"
    >
      <v-tab :key="tabs.upcoming" data-cy="upcoming-runs-tile-upcoming">
        {{
          upcomingRuns && upcomingRuns.length > 0 && tab === tabs.late
            ? `(${upcomingRuns.length})`
            : ''
        }}
        Upcoming
      </v-tab>
      <v-tab :key="tabs.late" data-cy="upcoming-runs-tile-late">
        <v-icon
          v-if="lateRuns && lateRuns.length > 0"
          class="mr-1"
          small
          color="deepRed"
        >
          warning
        </v-icon>
        {{
          lateRuns && lateRuns.length > 0 && tab === tabs.upcoming
            ? `(${lateRuns.length})`
            : ''
        }}
        Late
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab" class="flex-grow-1">
      <v-tab-item :key="tabs.upcoming">
        <upcoming-runs-tile-upcoming :loading="loading" :runs="upcomingRuns" />
      </v-tab-item>
      <v-tab-item :key="tabs.late">
        <upcoming-runs-tile-late :loading="loading" :runs="lateRuns" />
      </v-tab-item>
    </v-tabs-items>

    <v-card-actions class="py-0 justify-end">
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
