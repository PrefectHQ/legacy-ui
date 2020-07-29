<script>
/* eslint-disable */
import Agents from '@/components/Agents/Agents'
import AgentsTile from '@/pages/Dashboard/Agents-Tile'
import ApiHealthCheckTile from '@/pages/Dashboard/ApiHealthCheck-Tile'
import ErrorsTile from '@/pages/Dashboard/Errors-Tile'
import FlowRunHeartbeatTile from '@/pages/Dashboard/FlowRunHeartbeat-Tile'
import SummaryTile from '@/pages/Dashboard/Summary-Tile'
import FlowTableTile from '@/pages/Dashboard/FlowTable-Tile'
import UpcomingRunsTile from '@/pages/Dashboard/UpcomingRuns-Tile'
import FailuresTile from '@/pages/Dashboard/Failures-Tile'
import ProjectSelector from '@/pages/Dashboard/Project-Selector'
import SubPageNav from '@/layouts/SubPageNav'
import TileLayout from '@/layouts/TileLayout'
import TimelineTile from '@/pages/Dashboard/Timeline-Tile'
import { mapGetters } from 'vuex'

const serverTabs = [
  {
    name: 'Overview',
    target: 'overview',
    icon: 'view_quilt'
  },
  {
    name: 'Flows',
    target: 'flows',
    icon: 'pi-flow'
  }
]

const cloudTabs = [
  {
    name: 'Agents',
    target: 'agents',
    icon: 'pi-agent',
    iconSize: 'small'
  }
  // {
  //   name: 'Analytics',
  //   target: 'analytics',
  //   icon: 'insert_chart_outlined'
  // }
]

export default {
  components: {
    Agents,
    AgentsTile,
    ApiHealthCheckTile,
    ErrorsTile,
    FlowRunHeartbeatTile,
    FlowTableTile,
    ProjectSelector,
    SubPageNav,
    SummaryTile,
    FailuresTile,
    TileLayout,
    TimelineTile,
    UpcomingRunsTile
  },
  data() {
    return {
      key: 0,
      loading: 0,
      loadedTiles: 0,
      numberOfTiles: 7,
      previousParams: { flows: { flows: '' }, agents: { agents: '' } },
      projectId: this.$route.params.id,
      show: false,
      tab: this.getTab()
    }
  },
  computed: {
    ...mapGetters('alert', ['getAlert']),
    ...mapGetters('api', ['backend', 'isCloud', 'connected']),
    ...mapGetters('tenant', ['tenant']),
    hideOnMobile() {
      return { 'tabs-hidden': this.$vuetify.breakpoint.smAndDown }
    },
    tabs() {
      return [...serverTabs, ...(this.isCloud ? cloudTabs : [])]
    }
  },
  watch: {
    tab(val, prev) {
      let query = {}

      switch (val) {
        case 'flows':
          query = this.previousParams.flows
          break
        case 'agents':
          query = this.previousParams.agents
          break
        default:
          break
      }

      this.previousParams[prev] = this.$route.query
      this.$router.replace({ query }).catch(e => e)
    },
    $route(val) {
      if (Object.keys(val.query).length === 0 && this.tab !== 'overview') {
        this.tab = 'overview'
      }
    },
    backend() {
      this.refresh()
    },
    tenant(val) {
      this.refresh()
    }
  },
  mounted() {
    this.refresh()
  },
  methods: {
    handleProjectSelect(val) {
      this.projectId = val
      this.$apollo.queries.project.refetch()
    },
    getTab() {
      if ('flows' in this.$route.query) return 'flows'
      if ('agents' in this.$route.query) return 'agents'
      return 'overview'
    },
    refresh() {
      this.show = false

      setTimeout(() => {
        this.show = true
      }, 150)
      this.loadedTiles = 0
      let start

      const animationDuration = 150

      const loadTiles = time => {
        if (!start) start = time

        const elapsed = time - start

        if (elapsed > this.loadedTiles * animationDuration + 500) {
          this.loadedTiles++
        }

        if (this.loadedTiles <= this.numberOfTiles) {
          // eslint-disable-next-line
          requestAnimationFrame(loadTiles)
        }
      }

      requestAnimationFrame(loadTiles)
      this.$apollo.queries.project.refetch()
    }
  },
  apollo: {
    project: {
      query: require('@/graphql/Dashboard/project-name.gql'),
      variables() {
        return { id: this.projectId }
      },
      loadingKey: 'loading',
      update: data => (data.project ? data.project : null),
      skip() {
        return !this.projectId
      },
      fetchPolicy: 'no-cache'
    }
  }
}
</script>

<template>
  <v-sheet v-if="show" color="appBackground">
    <SubPageNav>
      <span slot="page-type">Dashboard</span>
      <span
        slot="page-title"
        :style="
          loading > 0
            ? {
                display: 'block',
                height: '28px',
                overflow: 'hidden'
              }
            : {}
        "
      >
        <span v-if="loading === 0">
          {{ projectId && project ? project.name : 'All Projects' }}
        </span>
        <span v-else>
          <v-skeleton-loader type="heading" tile></v-skeleton-loader>
        </span>
      </span>
      <span slot="page-actions">
        <v-skeleton-loader
          slot="row-0"
          :loading="loadedTiles < 4"
          type="text"
          transition="quick-fade"
          tile
        >
          <ProjectSelector @project-select="handleProjectSelect" />
        </v-skeleton-loader>
      </span>
    </SubPageNav>

    <v-tabs
      v-model="tab"
      class="px-6 mx-auto tabs-border-bottom"
      :class="hideOnMobile"
      style="max-width: 1440px;"
      light
    >
      <v-tabs-slider color="blue"></v-tabs-slider>

      <v-tab
        v-for="tb in tabs"
        :key="tb.target"
        :data-cy="`dashboard-${tb.target}-tab`"
        :href="`#${tb.target}`"
        :style="hideOnMobile"
      >
        <v-icon left :size="tb.iconSize || 'medium'">{{ tb.icon }}</v-icon>
        {{ tb.name }}
      </v-tab>
    </v-tabs>

    <v-tabs-items
      v-model="tab"
      class="px-6 mx-auto tabs-border-bottom"
      style="max-width: 1440px;"
      mandatory
    >
      <v-tab-item
        class="tab-full-height pa-0"
        value="overview"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <TileLayout>
          <v-skeleton-loader
            slot="row-0"
            :loading="loadedTiles < 7"
            type="image"
            height="200"
            transition="quick-fade"
            class="my-2"
            tile
          >
            <TimelineTile :project-id="projectId" />
          </v-skeleton-loader>

          <v-skeleton-loader
            slot="row-1-col-1-tile-1"
            :loading="loadedTiles < 2"
            type="image"
            min-height="329"
            height="100%"
            transition="quick-fade"
            class="my-2"
            tile
          >
            <SummaryTile :project-id="projectId" full-height />
          </v-skeleton-loader>

          <v-skeleton-loader
            slot="row-1-col-2-tile-1"
            :loading="loadedTiles < 3"
            type="image"
            min-height="329"
            height="100%"
            transition="quick-fade"
            class="my-2"
            tile
          >
            <ErrorsTile :project-id="projectId" full-height />
          </v-skeleton-loader>

          <v-skeleton-loader
            slot="row-1-col-3-tile-1"
            :loading="loadedTiles < 1"
            type="image"
            min-height="329"
            height="100%"
            transition="quick-fade"
            class="my-2"
            tile
          >
            <UpcomingRunsTile :key="key" :project-id="projectId" full-height />
          </v-skeleton-loader>

          <v-skeleton-loader
            slot="row-2-col-1-row-2-tile-1"
            :loading="loadedTiles < 5"
            type="image"
            height="300"
            transition="quick-fade"
            class="my-2"
            tile
          >
            <FlowRunHeartbeatTile :project-id="projectId" />
          </v-skeleton-loader>

          <v-skeleton-loader
            slot="row-2-col-2-row-2-tile-1"
            :loading="loadedTiles < 6"
            type="image"
            min-height="200px"
            height="100%"
            transition="quick-fade"
            class="my-2"
            tile
          >
            <FailuresTile :project-id="projectId" />
          </v-skeleton-loader>

          <v-skeleton-loader
            slot="row-2-col-2-row-2-tile-2"
            :loading="loadedTiles < 4"
            type="image"
            min-height="200px"
            height="100%"
            transition="quick-fade"
            class="my-2"
            tile
          >
            <AgentsTile v-if="isCloud" @view-details-clicked="tab = 'agents'" />
            <ApiHealthCheckTile v-else />
          </v-skeleton-loader>
        </TileLayout>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="flows"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <FlowTableTile class="mx-3 my-6" :project-id="projectId" />
      </v-tab-item>

      <v-tab-item
        v-if="isCloud"
        class="tab-full-height"
        value="agents"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <Agents class="mx-3 my-6" />
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="analytics"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        Nothing to see here :)
      </v-tab-item>
    </v-tabs-items>

    <v-bottom-navigation v-if="$vuetify.breakpoint.smAndDown" fixed>
      <v-btn v-for="tb in tabs" :key="tb.target" @click="tab = tb.target">
        {{ tb.name }}
        <v-icon>{{ tb.icon }}</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-sheet>
</template>

<style lang="scss">
.tab-full-height {
  min-height: 100vh;
}

// stylelint-disable
.v-skeleton-loader__image {
  height: inherit !important;
}
// stylelint-enable
</style>
