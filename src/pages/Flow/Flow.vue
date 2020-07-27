<script>
/* eslint-disable */
import Actions from '@/pages/Flow/Actions'
import BreadCrumbs from '@/components/BreadCrumbs'
import DetailsTile from '@/pages/Flow/Details-Tile'
import ErrorsTile from '@/pages/Flow/Errors-Tile'
import FlowRunHeartbeatTile from '@/pages/Flow/FlowRunHeartbeat-Tile'
import FlowRunTableTile from '@/pages/Flow/FlowRunTable-Tile'
import RunTiles from '@/pages/Flow/Run'
import SchematicTile from '@/pages/Flow/Schematic-Tile'
import Settings from '@/pages/Flow/Settings'
import SubPageNav from '@/layouts/SubPageNav'
import SummaryTile from '@/pages/Flow/Summary-Tile'
import TasksTableTile from '@/pages/Flow/TasksTable-Tile'
import TileLayout from '@/layouts/TileLayout'
import TileLayoutFull from '@/layouts/TileLayout-Full'
import TimelineTile from '@/pages/Flow/Timeline-Tile'
import UpcomingRunsTile from '@/pages/Flow/UpcomingRuns-Tile'
import VersionsTile from '@/pages/Flow/Versions-Tile'
import { mapGetters } from 'vuex'

export default {
  components: {
    Actions,
    BreadCrumbs,
    DetailsTile,
    ErrorsTile,
    FlowRunHeartbeatTile,
    FlowRunTableTile,
    RunTiles,
    SchematicTile,
    Settings,
    SubPageNav,
    SummaryTile,
    TasksTableTile,
    TileLayout,
    TileLayoutFull,
    TimelineTile,
    UpcomingRunsTile,
    VersionsTile
  },
  data() {
    return {
      loadingKey: 0,
      tab: this.getTab()
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
    hideOnMobile() {
      return { 'tabs-hidden': this.$vuetify.breakpoint.smAndDown }
    },
    flowGroupId() {
      return this.$route.params.id
    },
    flows() {
      if (!this.flowGroup) return
      return [...this.flowGroup.flows].sort((a, b) => b.version - a.version)
    },
    flowVersionId() {
      return this.$route.query.version
    },
    latest() {
      if (!this.flowGroup) return
      return this.flows[0]
    },
    loading() {
      return this.loadingKey > 0
    },
    project() {
      if (!this.flowGroup) return
      return this.selectedFlow.project
    },
    selectedFlow() {
      if (!this.flowGroup) return
      if (!this.flowVersionId) return this.latest
      let flow = this.flowGroup.flows.find(f => f.version == this.flowVersionId)
      return flow ? flow : this.latest
    },
    versions() {
      if (!this.flowGroup) return
      let versions = this.flows.map((f, i) => {
        return {
          text: f.version + (i === 0 ? ' (latest)' : ''),
          value: f.version
        }
      })
      versions.unshift({ text: 'All', value: null })

      return versions
    }
  },
  watch: {
    $route() {
      this.tab = this.getTab()
    },
    tab(val) {
      let query = { ...this.$route.query }
      switch (val) {
        case 'schematic':
          query.tab = 'schematic'
          break
        case 'runs':
          query.tab = 'runs'
          break
        case 'tasks':
          query.tab = 'tasks'
          break
        case 'versions':
          query.tab = 'versions'
          break
        case 'run':
          query.tab = 'run'
          break
        case 'settings':
          query.tab = 'settings'
          break
        default:
          delete query.tab
          break
      }
      this.$router
        .replace({
          query: query
        })
        .catch(e => e)
    }
  },
  methods: {
    getTab() {
      if (this.$route.query?.tab == 'schematic') return 'schematic'
      if (this.$route.query?.tab == 'runs') return 'runs'
      if (this.$route.query?.tab == 'tasks') return 'tasks'
      if (this.$route.query?.tab == 'versions') return 'versions'
      if (this.$route.query?.tab == 'run') return 'run'
      if (this.$route.query?.tab == 'settings') return 'settings'
      return 'overview'
    }
  },
  apollo: {
    flowGroup: {
      query() {
        return require('@/graphql/Flow/flow.js').default(this.isCloud)
      },
      variables() {
        return {
          id: this.flowGroupId
        }
      },
      loadingKey: 'loadingKey',
      pollInterval: 5000,
      update: data => data?.flow_group_by_pk
    },
    lastFlowRun: {
      query: require('@/graphql/Flow/last-flow-run.gql'),
      variables() {
        return {
          id: this.selectedFlow.id
        }
      },
      loadingKey: 'loadingKey',
      pollInterval: 5000,
      update: data => data?.flow_run[0],
      skip() {
        return !this.selectedFlow
      }
    }
  }
}
</script>

<template>
  <v-sheet color="appBackground">
    <SubPageNav>
      <span slot="page-type">Flow</span>

      <span
        slot="page-title"
        :style="
          !flowGroup
            ? {
                display: 'block',
                height: '28px',
                overflow: 'hidden',
                width: '400px'
              }
            : {}
        "
      >
        <div v-if="flowGroup">
          {{ selectedFlow.name }}
          <span v-if="selectedFlow.archived" class="ml-1 body-1 grey--text">
            (Archived)
          </span>
        </div>
        <div v-else style="width: 500px;">
          <v-skeleton-loader type="heading" tile></v-skeleton-loader>
        </div>
      </span>

      <span
        slot="breadcrumbs"
        :style="
          !flowGroup
            ? {
                display: 'block',
                height: '21px',
                overflow: 'hidden',
                width: '500px'
              }
            : {}
        "
      >
        <BreadCrumbs
          v-if="flowGroup"
          slot="breadcrumbs"
          :crumbs="[
            {
              route: { name: 'project', params: { id: project.id } },
              text: project.name
            }
          ]"
        ></BreadCrumbs>
        <v-skeleton-loader v-else type="text" />
      </span>

      <Actions
        v-if="selectedFlow"
        slot="page-actions"
        :archived="!!selectedFlow.archived"
        :flow="selectedFlow"
        :flow-group="flowGroup"
        :scheduled="selectedFlow.is_schedule_active"
        :versions="versions"
      />
    </SubPageNav>

    <v-tabs
      v-if="flowGroup"
      v-model="tab"
      class="px-6 mx-auto tabs-border-bottom"
      :class="hideOnMobile"
      style="max-width: 1440px;"
      light
    >
      <v-tabs-slider color="blue"></v-tabs-slider>

      <v-tab href="#overview" :style="hideOnMobile" data-cy="flow-overview-tab">
        <v-icon left>view_module</v-icon>
        Overview
      </v-tab>

      <v-tab href="#tasks" :style="hideOnMobile" data-cy="flow-tasks-tab">
        <v-icon left>pi-task</v-icon>
        Tasks
      </v-tab>

      <v-tab href="#runs" :style="hideOnMobile" data-cy="flow-runs-tab">
        <v-icon left>pi-flow-run</v-icon>
        Runs
      </v-tab>

      <v-tab
        href="#schematic"
        :style="hideOnMobile"
        data-cy="flow-schematic-tab"
      >
        <v-icon left>pi-schematic</v-icon>
        Schematic
      </v-tab>

      <v-tab href="#versions" :style="hideOnMobile" data-cy="flow-versions-tab">
        <v-icon left>loop</v-icon>
        Versions
      </v-tab>

      <!-- <v-tab href="#analytics" :style="hideOnMobile" disabled>
        <v-icon left>insert_chart_outlined</v-icon>
        Analytics
      </v-tab> -->

      <v-tab href="#run" :style="hideOnMobile" data-cy="run-flow-tab">
        <v-icon left>fa-rocket</v-icon>
        Run
      </v-tab>

      <v-spacer />

      <v-tab href="#settings" :style="hideOnMobile" data-cy="flow-settings-tab">
        <v-icon left>settings</v-icon>
        Settings
      </v-tab>
    </v-tabs>

    <v-tabs-items
      v-model="tab"
      v-if="flowGroup"
      class="px-6 mx-auto tabs-border-bottom"
      style="max-width: 1440px;"
    >
      <v-tab-item
        class="tab-full-height pa-0"
        value="overview"
        transition="fade"
        reverse-transition="fade"
      >
        <TileLayout>
          <TimelineTile
            slot="row-0"
            :aggregate="!flowVersionId"
            :flow="selectedFlow"
          />

          <DetailsTile
            slot="row-1-col-1-tile-1"
            :flow="selectedFlow"
            :last-flow-run="lastFlowRun"
            full-height
          />

          <SummaryTile
            slot="row-1-col-2-tile-1"
            :aggregate="!flowVersionId"
            :flow="selectedFlow"
            full-height
          />

          <UpcomingRunsTile
            slot="row-1-col-3-tile-1"
            :aggregate="!flowVersionId"
            :flow="selectedFlow"
            full-height
          />

          <ErrorsTile
            slot="row-1-col-4-tile-1"
            :aggregate="!flowVersionId"
            :flow="selectedFlow"
            full-height
          />

          <FlowRunHeartbeatTile
            slot="row-2-col-1-row-4-tile-1"
            :aggregate="!flowVersionId"
            :flow="selectedFlow"
          />
        </TileLayout>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="tasks"
        transition="fade"
        reverse-transition="fade"
      >
        <TileLayoutFull>
          <TasksTableTile slot="row-2-tile" :flow="selectedFlow" />
        </TileLayoutFull>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="runs"
        transition="fade"
        reverse-transition="fade"
      >
        <TileLayoutFull>
          <FlowRunTableTile
            slot="row-2-tile"
            :aggregate="!flowVersionId"
            :flow="selectedFlow"
          />
        </TileLayoutFull>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="schematic"
        transition="fade"
        reverse-transition="fade"
      >
        <TileLayoutFull>
          <SchematicTile slot="row-2-tile" :flow="selectedFlow" />
        </TileLayoutFull>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="versions"
        transition="fade"
        reverse-transition="fade"
      >
        <TileLayoutFull>
          <VersionsTile slot="row-2-tile" :flow-group-id="flowGroup.id" />
        </TileLayoutFull>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="run"
        transition="fade"
        reverse-transition="fade"
      >
        <RunTiles :flow="selectedFlow" />
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="settings"
        transition="fade"
        reverse-transition="fade"
      >
        <TileLayoutFull>
          <Settings
            slot="row-2-tile"
            :flow="selectedFlow"
            :flow-group="flowGroup"
          />
        </TileLayoutFull>
      </v-tab-item>
    </v-tabs-items>

    <v-bottom-navigation
      v-if="$vuetify.breakpoint.smAndDown"
      color="primary"
      fixed
    >
      <v-btn :input-value="tab == 'overview'" @click="tab = 'overview'">
        Overview
        <v-icon>view_module</v-icon>
      </v-btn>

      <v-btn :input-value="tab == 'tasks'" @click="tab = 'tasks'">
        Tasks
        <v-icon>pi-task</v-icon>
      </v-btn>

      <v-btn :input-value="tab == 'runs'" @click="tab = 'runs'">
        Runs
        <v-icon>pi-flow-run</v-icon>
      </v-btn>

      <v-btn :input-value="tab == 'schematic'" @click="tab = 'schematic'">
        Schematic
        <v-icon>pi-schematic</v-icon>
      </v-btn>

      <v-btn :input-value="tab == 'versions'" @click="tab = 'versions'">
        Versions
        <v-icon>loop</v-icon>
      </v-btn>

      <!-- <v-btn disabled @click="tab = 'analytics'">
        Analytics
        <v-icon>insert_chart_outlined</v-icon>
      </v-btn> -->

      <v-btn :input-value="tab == 'run'" @click="tab = 'run'">
        Run
        <v-icon>fa-rocket</v-icon>
      </v-btn>

      <v-btn :input-value="tab == 'settings'" @click="tab = 'settings'">
        Settings
        <v-icon>settings</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-sheet>
</template>

<style lang="scss">
.tab-full-height {
  min-height: 80vh;
}
</style>
