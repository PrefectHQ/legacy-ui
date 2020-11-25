<script>
/* eslint-disable */
import Actions from '@/pages/Flow/Actions'
import BreadCrumbs from '@/components/BreadCrumbs'
import NavTabBar from '@/components/NavTabBar'
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
import FlowRunHistoryTile from '@/pages/Flow/FlowRunHistory-Tile'
import UpcomingRunsTile from '@/pages/Flow/UpcomingRuns-Tile'
import VersionsTile from '@/pages/Flow/Versions-Tile'
import { mapGetters } from 'vuex'

export default {
  metaInfo() {
    return {
      titleTemplate: `Flow | ${this.selectedFlow?.name ?? 'Prefect'}`
    }
  },
  components: {
    Actions,
    BreadCrumbs,
    DetailsTile,
    ErrorsTile,
    FlowRunHeartbeatTile,
    FlowRunTableTile,
    NavTabBar,
    RunTiles,
    SchematicTile,
    Settings,
    SubPageNav,
    SummaryTile,
    TasksTableTile,
    TileLayout,
    TileLayoutFull,
    FlowRunHistoryTile,
    UpcomingRunsTile,
    VersionsTile
  },
  data() {
    return {
      loadingKey: 0,
      tab: this.getTab(),
      tabs: [
        {
          name: 'Overview',
          target: 'overview',
          icon: 'view_module'
        },
        {
          name: 'Tasks',
          target: 'tasks',
          icon: 'pi-task'
        },
        {
          name: 'Runs',
          target: 'runs',
          icon: 'pi-flow-run'
        },
        {
          name: 'Schematic',
          target: 'schematic',
          icon: 'pi-schematic'
        },
        {
          name: 'Versions',
          target: 'versions',
          icon: 'loop'
        },
        {
          name: 'Run',
          target: 'run',
          icon: 'fa-rocket'
        },
        {
          name: 'Settings',
          target: 'settings',
          icon: 'settings',
          align: 'right'
        }
      ]
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud']),
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
          query = 'schematic'
          break
        case 'runs':
          query = 'runs'
          break
        case 'tasks':
          query = 'tasks'
          break
        case 'versions':
          query = 'versions'
          break
        case 'run':
          query = 'run'
          break
        case 'settings':
          query = 'settings'
          break
        default:
          break
      }
    }
  },
  methods: {
    getTab() {
      if (Object.keys(this.$route.query).length != 0) {
        let target = Object.keys(this.$route.query)[0]
        if (this.tabs?.find(tab => tab.target == target)) return target
      }
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
    <SubPageNav icon="pi-flow" page-type="Flow">
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
            : $vuetify.breakpoint.smAndDown && { display: 'inline' }
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
                height: '21px',
                overflow: 'hidden',
                width: '500px'
              }
            : $vuetify.breakpoint.smAndDown && {
                display: 'inline',
                'font-size': '0.875rem'
              }
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
      <span slot="tabs" style="width: 100%;"
        ><NavTabBar :tabs="tabs" v-if="flowGroup" page="flow"
      /></span>
    </SubPageNav>

    <v-tabs-items
      v-model="tab"
      v-if="flowGroup"
      class="px-6 mx-auto tabs-border-bottom"
      style="max-width: 1440px;"
      :style="{
        'padding-top': $vuetify.breakpoint.smOnly ? '80px' : '130px'
      }"
    >
      <v-tab-item
        class="tab-full-height pa-0"
        value="overview"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <TileLayout>
          <FlowRunHistoryTile
            slot="row-0"
            :aggregate="!flowVersionId"
            :flow="selectedFlow"
            :visible="tab == 'overview'"
          />

          <DetailsTile
            slot="row-1-col-1-tile-1"
            :flow="selectedFlow"
            :flow-group="flowGroup"
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
            :flow-group="flowGroup"
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
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <TileLayoutFull>
          <TasksTableTile slot="row-2-tile" :flow="selectedFlow" />
        </TileLayoutFull>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="runs"
        transition="quick-fade"
        reverse-transition="quick-fade"
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
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <TileLayoutFull>
          <SchematicTile slot="row-2-tile" :flow="selectedFlow" />
        </TileLayoutFull>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="versions"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <TileLayoutFull>
          <VersionsTile slot="row-2-tile" :flow-group-id="flowGroup.id" />
        </TileLayoutFull>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="run"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <RunTiles :flow="selectedFlow" :flow-group="flowGroup" />
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="settings"
        transition="quick-fade"
        reverse-transition="quick-fade"
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
