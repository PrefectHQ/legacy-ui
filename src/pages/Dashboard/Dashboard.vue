<script>
import Agents from '@/components/Agents/Agents'
import AgentsTile from '@/pages/Dashboard/Agents-Tile'
import FailedFlowsTile from '@/pages/Dashboard/FailedFlows-Tile'
import FlowTableTile from '@/pages/Dashboard/FlowTable-Tile'
import InProgressTile from '@/pages/Dashboard/InProgress-Tile'
import NotificationsTile from '@/pages/Dashboard/Notifications-Tile'
import ProjectSelector from '@/pages/Dashboard/Project-Selector'
import SummaryTile from '@/pages/Dashboard/Summary-Tile'
import UpcomingRunsTile from '@/pages/Dashboard/UpcomingRuns-Tile'
import SubPageNav from '@/layouts/SubPageNav'
import TileLayout from '@/layouts/TileLayout'
import FlowRunHistoryTile from '@/pages/Dashboard/FlowRunHistory-Tile'
import { mapGetters } from 'vuex'
import gql from 'graphql-tag'

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
  },
  {
    name: 'Agents',
    target: 'agents',
    icon: 'pi-agent',
    iconSize: 'small'
  }
]

const cloudTabs = []

export default {
  metaInfo() {
    return {
      titleTemplate: `%s | ${this.project ? this.project.name : 'All Projects'}`
    }
  },
  components: {
    Agents,
    AgentsTile,
    FailedFlowsTile,
    FlowTableTile,
    InProgressTile,
    NotificationsTile,
    ProjectSelector,
    SubPageNav,
    SummaryTile,
    TileLayout,
    FlowRunHistoryTile,
    UpcomingRunsTile
  },
  async beforeRouteLeave(to, from, next) {
    if (!to.query?.notification_id) return next()
    try {
      if (to.query?.notification_id) {
        let mutationString = gql`
        mutation MarkMessagesAsRead {
          mark_message_as_read(input: { message_id: "${to.query.notification_id}" }) {
            success
            error
          }
        }
      `
        await this.$apollo.mutate({
          mutation: mutationString
        })

        delete to.query.notification_id
      }
    } finally {
      next({ name: to.name, params: to.params })
    }
  },
  data() {
    return {
      key: 0,
      loading: 0,
      loadedTiles: 0,
      numberOfTiles: 9,
      projectId: this.$route.params.id,
      refreshTimeout: null,
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
    backend() {
      this.loadedTiles = 0

      this.refreshTimeout = setTimeout(() => {
        this.refresh()
        clearTimeout(this.refreshTimeout)
      }, 3000)
    },
    tab(val) {
      let tab = 'overview'

      switch (val) {
        case 'flows':
          tab = 'flows'
          break
        case 'agents':
          tab = 'agents'
          break
        default:
          break
      }

      if (!(tab in this.$route.query)) {
        this.$router.push(
          {
            name: this.$route.name,
            params: this.$route.params,
            query:
              tab == 'overview'
                ? null
                : {
                    [tab]: ''
                  }
          },
          () => {}
        )
      }
    },
    $route(val) {
      if (val.name == 'dashboard') {
        this.tab = this.getTab()
      }
    },
    tenant(val) {
      if (val?.id) {
        this.loadedTiles = 0
        clearTimeout(this.refreshTimeout)
        this.refresh()
      }
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
      let start

      const animationDuration = 150

      const loadTiles = time => {
        if (!start) start = time

        const elapsed = time - start

        if (elapsed > this.loadedTiles * animationDuration + 500) {
          this.loadedTiles++
        }

        if (this.loadedTiles <= this.numberOfTiles) {
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
  <v-sheet color="appBackground">
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
          <span class="font-weight-medium">{{ tenant.name }}</span> -
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
            <FlowRunHistoryTile
              :project-id="projectId"
              :visible="tab == 'overview'"
            />
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
            :loading="loadedTiles < 6"
            type="image"
            min-height="200px"
            height="100%"
            transition="quick-fade"
            class="my-2"
            tile
          >
            <FailedFlowsTile :project-id="projectId" />
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
            min-height="329"
            height="100%"
            transition="quick-fade"
            class="my-2"
            tile
          >
            <NotificationsTile :project-id="projectId" full-height />
          </v-skeleton-loader>

          <v-skeleton-loader
            slot="row-2-col-2-row-2-tile-1"
            :loading="loadedTiles < 3"
            type="image"
            min-height="329"
            height="100%"
            transition="quick-fade"
            class="my-2"
            tile
          >
            <InProgressTile :project-id="projectId" full-height />
          </v-skeleton-loader>

          <v-skeleton-loader
            slot="row-2-col-2-row-2-tile-2"
            :loading="loadedTiles < 4"
            type="image"
            min-height="329"
            height="100%"
            transition="quick-fade"
            class="my-2"
            tile
          >
            <AgentsTile full-height @view-details-clicked="tab = 'agents'" />
          </v-skeleton-loader>
        </TileLayout>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="flows"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <FlowTableTile
          v-if="loadedTiles > 8"
          class="mx-3 my-6"
          :project-id="projectId"
        />
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="agents"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <Agents v-if="loadedTiles > 9" class="mx-3 my-6" />
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
// stylelint-disable
.v-skeleton-loader__image {
  height: inherit !important;
}
// stylelint-enable
</style>
