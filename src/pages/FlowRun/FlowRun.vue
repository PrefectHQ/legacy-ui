<script>
import { mapGetters } from 'vuex'

import Actions from '@/pages/FlowRun/Actions'
import BreadCrumbs from '@/components/BreadCrumbs'
import DetailsTile from '@/pages/FlowRun/Details-Tile'
import ExternalLink from '@/components/ExternalLink'
import TimelineTile from '@/pages/FlowRun/Timeline-Tile'
import LogsCard from '@/components/LogsCard/LogsCard'
import SchematicTile from '@/pages/FlowRun/Schematic-Tile'
import SubPageNav from '@/layouts/SubPageNav'
import TaskRunHeartbeatTile from '@/pages/FlowRun/TaskRunHeartbeat-Tile'
import TaskRunTableTile from '@/pages/FlowRun/TaskRunTable-Tile'
import TileLayout from '@/layouts/TileLayout'
import TileLayoutFull from '@/layouts/TileLayout-Full'
import { parser } from '@/utils/markdownParser'

export default {
  metaInfo() {
    return {
      title: this.flowRun
        ? `Run | ${this.flowRun.flow?.name} - ${this.flowRun.name}`
        : null,
      link: [
        {
          rel: 'icon',
          type: 'image/svg',
          href: this.flowRun
            ? `/state-icons/${this.flowRun.state.toLowerCase()}.svg`
            : null,
          vmid: 'favicon'
        }
      ]
    }
  },
  components: {
    Actions,
    BreadCrumbs,
    DetailsTile,
    ExternalLink,
    TimelineTile,
    LogsCard,
    SchematicTile,
    SubPageNav,
    TaskRunHeartbeatTile,
    TaskRunTableTile,
    TileLayout,
    TileLayoutFull
  },
  data() {
    return {
      tab: this.getTab()
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('api', ['isCloud']),
    flowId() {
      return this.flowRun?.flow_id
    },
    flowRunId() {
      return this.$route.params.id
    },
    hideOnMobile() {
      return { 'tabs-hidden': this.$vuetify.breakpoint.smAndDown }
    }
  },
  watch: {
    $route() {
      this.tab = this.getTab()
    },
    tab(val) {
      let query = {}
      switch (val) {
        case 'schematic':
          query = { schematic: '' }
          break
        case 'logs':
          query = { logId: '' }
          break
        case 'chart':
          query = { chart: '' }
          break
        case 'artifacts':
          query = { artifacts: '' }
          break
        default:
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
      if ('schematic' in this.$route.query) return 'schematic'
      if ('logId' in this.$route.query) return 'logs'
      if ('chart' in this.$route.query) return 'chart'
      if ('artifacts' in this.$route.query) return 'artifacts'
      return 'overview'
    },
    parseMarkdown(md) {
      return parser(md)
    }
  },
  apollo: {
    flowRun: {
      query() {
        return require('@/graphql/FlowRun/flow-run.js').default(this.isCloud)
      },
      variables() {
        return {
          id: this.flowRunId
        }
      },
      pollInterval: 5000,
      update: data => data.flow_run_by_pk
    }
  }
}
</script>

<template>
  <v-sheet v-if="flowRun" color="appBackground">
    <SubPageNav>
      <span slot="page-type">Flow Run</span>
      <span slot="page-title">
        {{ flowRun.name }}
      </span>

      <BreadCrumbs
        slot="breadcrumbs"
        :crumbs="[
          {
            route: {
              name: 'project',
              params: { id: flowRun.flow.project.id }
            },
            text: flowRun.flow.project.name
          },
          {
            route: {
              name: 'flow',
              params: { id: flowRun.flow.id }
            },
            text: flowRun.flow.name
          }
        ]"
      ></BreadCrumbs>

      <Actions slot="page-actions" :flow-run="flowRun" />
    </SubPageNav>

    <v-tabs
      v-if="flowRun"
      v-model="tab"
      class="px-6 mx-auto tabs-border-bottom"
      :class="hideOnMobile"
      style="max-width: 1440px;"
      light
    >
      <v-tabs-slider color="blue"></v-tabs-slider>

      <v-tab href="#overview" :style="hideOnMobile">
        <v-icon left>view_quilt</v-icon>
        Overview
      </v-tab>

      <v-tab href="#schematic" :style="hideOnMobile">
        <v-icon left>pi-schematic</v-icon>
        Schematic
      </v-tab>

      <v-tab href="#logs" :style="hideOnMobile" data-cy="flow-run-logs-tab">
        <v-icon left>format_align_left</v-icon>
        Logs
      </v-tab>

      <v-menu
        open-on-hover
        :close-on-click="false"
        :open-on-click="false"
        :close-on-content-click="false"
        offset-y
      >
        <template #activator="{on}">
          <div v-on="on">
            <!-- Height: 100% is required here since we're nesting the tab -->
            <v-tab
              href="#artifacts"
              :style="hideOnMobile"
              style="height: 100%;"
              disabled
            >
              <v-badge
                color="codePink"
                content="Coming Soon!"
                bottom
                bordered
                inline
              >
                <v-icon left>fas fa-fingerprint</v-icon>
                Artifacts
              </v-badge>
            </v-tab>
          </div>
        </template>
        <v-card tile class="pa-0" max-width="320">
          <v-card-title>
            <v-badge
              color="codePink"
              content="Coming Soon!"
              bottom
              bordered
              inline
            >
              <v-icon left>fas fa-fingerprint</v-icon>
              Artifacts
            </v-badge>
          </v-card-title>
          <v-card-text>
            <div>
              The Artifacts API is an experimental feature set currently under
              development. For a sneak preview, check out the
              <ExternalLink
                href="https://docs.prefect.io/api/latest/artifacts/artifacts.html#artifacts"
              >
                Artifacts API docs
              </ExternalLink>
              !
            </div>
          </v-card-text>
        </v-card>
      </v-menu>
    </v-tabs>

    <v-tabs-items
      v-model="tab"
      class="px-6 mx-auto tabs-border-bottom"
      :style="{ 'max-width': tab == 'chart' ? 'auto' : '1440px' }"
      mandatory
    >
      <v-tab-item
        class="tab-full-height pa-0"
        value="overview"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <TileLayout>
          <TimelineTile
            v-if="flowId"
            slot="row-0"
            condensed
            :flow-id="flowId"
            :flow-run-id="flowRunId"
            :flow-run="flowRun"
          />

          <DetailsTile slot="row-2-col-1-row-1-tile-1" :flow-run="flowRun" />

          <TaskRunHeartbeatTile
            slot="row-2-col-1-row-4-tile-1"
            :flow-run-id="$route.params.id"
          />

          <TaskRunTableTile
            slot="row-2-col-2-row-3-tile-1"
            :flow-run-id="flowRun.id"
          />
        </TileLayout>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="schematic"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <TileLayoutFull>
          <SchematicTile slot="row-2-tile" />
        </TileLayoutFull>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="logs"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <TileLayoutFull>
          <LogsCard
            slot="row-2-tile"
            class="py-2 mt-4"
            entity="flow"
            :query="require('@/graphql/Logs/flow-run-logs.gql')"
            :query-for-scoping="
              require('@/graphql/Logs/flow-run-logs-scoping.gql')
            "
            query-key="flow_run_by_pk"
            :variables="{ id: $route.params.id }"
          />
        </TileLayoutFull>
      </v-tab-item>

      <v-tab-item class="tab-full-height" value="artifacts">
        <!-- <div v-html="parseMarkdown('# Hello!')"></div> -->
      </v-tab-item>
    </v-tabs-items>

    <v-bottom-navigation v-if="$vuetify.breakpoint.smAndDown" fixed>
      <v-btn @click="tab = 'overview'">
        Overview
        <v-icon>view_quilt</v-icon>
      </v-btn>

      <v-btn @click="tab = 'schematic'">
        Schematic
        <v-icon>pi-schematic</v-icon>
      </v-btn>

      <v-btn @click="tab = 'logs'">
        Logs
        <v-icon>format_align_left</v-icon>
      </v-btn>

      <v-btn disabled @click="tab = 'artifacts'">
        Artifacts
        <v-icon>fas fa-fingerprint</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-sheet>
</template>

<style lang="scss">
.custom-tab-active {
  background-color: #c8e1ff !important;
}

.tab-full-height {
  min-height: 80vh;
}

/* stylelint-disable */

.v-tab--disabled .v-badge__badge {
  pointer-events: none;
}

.v-badge--inline .v-badge__badge,
.v-badge--inline .v-badge__wrapper {
  margin: 5px;
}
</style>
