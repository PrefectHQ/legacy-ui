<script>
import { mapActions, mapGetters } from 'vuex'

import Actions from '@/pages/FlowRun/Actions'
import Artifacts from '@/components/Artifacts/Artifacts'
import BreadCrumbs from '@/components/BreadCrumbs'
import NavTabBar from '@/components/NavTabBar'
import DetailsTile from '@/pages/FlowRun/Details-Tile'
import EditableTextField from '@/components/EditableTextField'
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
    Artifacts,
    BreadCrumbs,
    DetailsTile,
    EditableTextField,
    TimelineTile,
    LogsCard,
    NavTabBar,
    SchematicTile,
    SubPageNav,
    TaskRunHeartbeatTile,
    TaskRunTableTile,
    TileLayout,
    TileLayoutFull
  },
  data() {
    return {
      flowRunNameLoading: false,
      tab: this.getTab(),
      tabs: [
        {
          name: 'Overview',
          target: 'overview',
          icon: 'view_quilt'
        },
        {
          name: 'Schematic',
          target: 'schematic',
          icon: 'pi-schematic'
        },
        {
          name: 'Logs',
          target: 'logs',
          icon: 'format_align_left'
        },
        {
          name: 'Artifacts',
          target: 'artifacts',
          icon: 'fas fa-fingerprint',
          badgeText: 'Beta',
          cardText:
            'The Artifacts API is a beta feature currently under development. Task mapping with artifacts may have unexpected results... for more information on artifacts, check out the',
          cardLink:
            'https://docs.prefect.io/api/latest/artifacts/artifacts.html#artifacts',
          cardLinkText: 'Artifacts API Docs'
        }
      ]
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
        case 'logs':
          query = 'logId'
          break
        case 'chart':
          query = { chart: '' }
          break
        case 'artifacts':
          /* eslint-disable-next-line */
          query = 'artifacts'
          break
        default:
          break
      }
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    getTab() {
      if (Object.keys(this.$route.query).length != 0) {
        return Object.keys(this.$route.query)[0]
      }
      return 'overview'
    },
    parseMarkdown(md) {
      return parser(md)
    },
    async saveFlowRunName(e) {
      const previousName = this.flowRun.name
      if (previousName === e) return

      try {
        this.flowRunNameLoading = true

        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/set-flow-run-name.gql'),
          variables: {
            input: {
              flow_run_id: this.flowRunId,
              name: e
            }
          }
        })

        await this.$apollo.queries.flowRun.refetch()

        if (!data.set_flow_run_name.success) {
          throw new Error(data.set_flow_run_name.error)
        }

        this.setAlert({
          alertShow: true,
          alertMessage: `<span class="font-weight-medium">${previousName}</span> has been renamed to <span class="font-weight-medium">${e}</span>`,
          alertType: 'success'
        })
      } catch {
        this.setAlert({
          alertShow: true,
          alertMessage:
            'Oops! Something went wrong while trying to update your flow run name, please try again.',
          alertType: 'error'
        })
      } finally {
        this.flowRunNameLoading = false
      }
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
    <SubPageNav icon="pi-flow-run" page-type="Flow Run">
      <span
        slot="page-title"
        style="
        max-width: 100%;
        min-width: 300px;
        width: auto;
        "
        :style="[
          { display: $vuetify.breakpoint.smAndDown ? 'inline' : 'block' }
        ]"
      >
        <EditableTextField
          :content="flowRun.name"
          label="Flow run name"
          :loading="flowRunNameLoading"
          required
          @change="saveFlowRunName"
        />
      </span>

      <span
        slot="breadcrumbs"
        :style="
          $vuetify.breakpoint.smAndDown && {
            display: 'inline',
            'font-size': '0.875rem'
          }
        "
      >
        <BreadCrumbs
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
        />
      </span>

      <Actions slot="page-actions" style="height: 55px;" :flow-run="flowRun" />
      <span slot="tabs" style="width: 100%;">
        <NavTabBar :tabs="tabs" page="flow-run" />
      </span>
    </SubPageNav>

    <v-tabs-items
      v-model="tab"
      class="px-6 mx-auto tabs-border-bottom tab-full-height"
      :style="{
        'max-width': tab == 'chart' ? 'auto' : '1440px',
        'padding-top': $vuetify.breakpoint.smOnly ? '80px' : '130px'
      }"
      mandatory
    >
      <v-tab-item
        class="pa-0"
        value="overview"
        transition="tab-fade"
        reverse-transition="tab-fade"
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
        value="schematic"
        transition="tab-fade"
        reverse-transition="tab-fade"
      >
        <TileLayoutFull>
          <SchematicTile slot="row-2-tile" />
        </TileLayoutFull>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="logs"
        transition="tab-fade"
        reverse-transition="tab-fade"
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

      <v-tab-item
        class="tab-full-height"
        value="artifacts"
        transition="tab-fade"
        reverse-transition="tab-fade"
      >
        <Artifacts :flow-run-id="flowRunId" />
      </v-tab-item>
    </v-tabs-items>

    <v-bottom-navigation v-if="$vuetify.breakpoint.smAndDown" app fixed>
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

/* stylelint-disable */
.v-tab--disabled .v-badge__badge {
  pointer-events: none;
}

.v-badge--inline .v-badge__badge,
.v-badge--inline .v-badge__wrapper {
  margin: 5px;
}
</style>
