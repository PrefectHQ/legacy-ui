<script>
import { mapGetters } from 'vuex'

import Actions from '@/pages/TaskRun/Actions'
import BreadCrumbs from '@/components/BreadCrumbs'
import NavTabBar from '@/components/NavTabBar'
import DetailsTile from '@/pages/TaskRun/Details-Tile'
import LogsCard from '@/components/LogsCard/LogsCard'
import DependenciesTile from '@/pages/TaskRun/Dependencies-Tile'
import MappedTaskRunsTile from '@/pages/TaskRun/MappedTaskRuns-Tile'
import SubPageNav from '@/layouts/SubPageNav'
import TaskRunHeartbeatTile from '@/pages/TaskRun/TaskRunHeartbeat-Tile'
import TileLayout from '@/layouts/TileLayout'
import TileLayoutFull from '@/layouts/TileLayout-Full'
import { parser } from '@/utils/markdownParser'

export default {
  metaInfo() {
    return {
      title: this.taskRun
        ? `Task Run | ${this.taskRun?.name ?? this.taskRun?.task?.name}`
        : null,
      link: [
        {
          rel: 'icon',
          type: 'image/svg',
          href: this.taskRun
            ? `/state-icons/${this.taskRun.state.toLowerCase()}.svg`
            : null,
          vmid: 'favicon'
        }
      ]
    }
  },
  components: {
    Actions,
    BreadCrumbs,
    DependenciesTile,
    DetailsTile,
    LogsCard,
    MappedTaskRunsTile,
    NavTabBar,
    SubPageNav,
    TaskRunHeartbeatTile,
    TileLayout,
    TileLayoutFull
  },
  data() {
    return {
      loading: 0,
      tab: this.getTab(),
      tabs: [
        {
          name: 'Overview',
          target: 'overview',
          icon: 'view_module'
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
          disabled: true
        },
        {
          name: 'Mapped Runs',
          target: 'mapped-runs',
          icon: 'device_hub',
          hidden: !this.mappedParent || !this.mappedChild
        }
      ]
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    taskRunId() {
      return this.$route.params.id
    },
    // Is this the correct definition? Can a mapped task run have siblings and children?
    mappedParent() {
      return this.taskRun?.task.mapped && this.taskRun?.map_index === -1
    },
    mappedChild() {
      return this.taskRun?.task.mapped && this.taskRun?.map_index > -1
    }
  },
  watch: {
    $route() {
      this.tab = this.getTab()
    },
    tab(val) {
      let query = { ...this.$route.query }
      switch (val) {
        case 'logs':
          query = 'logId'
          break
        case 'mapped-runs':
          query = 'mapped-runs'
          break
        case 'artifacts':
          /* eslint-disable-next-line */
          query = 'artifacts'
          break
        default:
          break
      }
    },
    taskRun(val, prevVal) {
      if (!val || val?.id == prevVal?.id) return
      if (!this.$route.query || !this.$route.query.schematic) {
        this.$router
          .replace({
            query: {
              ...this.$route.query,
              schematic: this.taskRun.task.id
            }
          })
          .catch(e => e)
      }
    }
  },
  methods: {
    getTab() {
      if (Object.keys(this.$route.query).length != 0) {
        return Object.keys(this.$route.query)[0]
      }
      return 'overview'
    },
    parseMarkdown(md) {
      return parser(md)
    }
  },
  apollo: {
    taskRun: {
      query: require('@/graphql/TaskRun/task-run.gql'),
      variables() {
        return {
          id: this.taskRunId
        }
      },
      loadingKey: 'loading',
      pollInterval: 5000,
      update: data => data.task_run_by_pk
    },
    parent: {
      query: require('@/graphql/TaskRun/parent.gql'),
      variables() {
        return {
          taskId: this.taskRun ? this.taskRun.task.id : null,
          flowRunId: this.taskRun ? this.taskRun.flow_run.id : null
        }
      },
      loadingKey: 'loading',
      pollInterval: 5000,
      update: data => (data.task_run ? data.task_run.length : null)
    }
  }
}
</script>

<template>
  <v-sheet v-if="taskRun" color="appBackground">
    <SubPageNav>
      <span slot="page-type">Task Run</span>
      <span slot="page-title">
        {{ taskRun.flow_run.name }} -
        <span v-if="taskRun.name">{{ taskRun.name }}</span>
        <span v-else>
          {{ taskRun.task.name }}
          <span v-if="taskRun.map_index > -1">
            (Mapped Child {{ taskRun.map_index }})
          </span>
          <span v-else-if="parent > 1"> (Parent) </span>
        </span>
      </span>
      <BreadCrumbs
        slot="breadcrumbs"
        :crumbs="[
          {
            route: {
              name: 'project',
              params: { id: taskRun.flow_run.flow.project.id }
            },
            text: taskRun.flow_run.flow.project.name
          },
          {
            route: {
              name: 'flow',
              params: { id: taskRun.flow_run.flow.flow_group_id }
            },
            text: taskRun.flow_run.flow.name
          },
          {
            route: {
              name: 'flow-run',
              params: { id: taskRun.flow_run.id }
            },
            text: taskRun.flow_run.name
          }
        ]"
      ></BreadCrumbs>

      <Actions slot="page-actions" :task-run="taskRun" />
      <span slot="tabs"><NavTabBar :tabs="tabs" page="task-run"/></span>
    </SubPageNav>

    <v-tabs-items
      v-model="tab"
      class="px-6 mx-auto tabs-border-bottom"
      style="max-width: 1440px;"
    >
      <v-tab-item
        class="tab-full-height pa-0"
        value="overview"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <TileLayout>
          <DetailsTile slot="row-2-col-1-row-1-tile-1" :task-run="taskRun" />

          <TaskRunHeartbeatTile
            slot="row-2-col-1-row-4-tile-1"
            :task-run-id="$route.params.id"
          />

          <DependenciesTile
            slot="row-2-col-2-row-3-tile-1"
            :task-run="taskRun"
            :loading="loading > 0"
          />
        </TileLayout>
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
            entity="task"
            :query="require('@/graphql/Logs/task-run-logs.gql')"
            :query-for-scoping="
              require('@/graphql/Logs/task-run-logs-scoping.gql')
            "
            query-key="task_run_by_pk"
            :variables="{ id: $route.params.id }"
          />
        </TileLayoutFull>
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="artifacts"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <!-- <div v-html="parseMarkdown('# hello')"></div> -->
      </v-tab-item>

      <v-tab-item
        class="tab-full-height"
        value="mapped-runs"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <TileLayoutFull>
          <v-skeleton-loader
            slot="row-2-tile"
            :loading="loading > 0"
            type="image"
            height="800"
            transition="quick-fade"
            class="my-2"
            tile
          >
            <MappedTaskRunsTile :task-run="taskRun" />
          </v-skeleton-loader>
        </TileLayoutFull>
      </v-tab-item>
    </v-tabs-items>

    <v-bottom-navigation v-if="$vuetify.breakpoint.smAndDown" fixed>
      <v-btn @click="tab = 'overview'">
        Overview
        <v-icon>view_module</v-icon>
      </v-btn>

      <v-btn @click="tab = 'logs'">
        Logs
        <v-icon>format_align_left</v-icon>
      </v-btn>

      <v-btn disabled @click="tab = 'artifacts'">
        Artifacts
        <v-icon>fas fa-fingerprint</v-icon>
      </v-btn>

      <v-btn @click="tab = 'mapped-runs'">
        Mapped Runs
        <v-icon>device_hub</v-icon>
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
