<script>
import BreadCrumbs from '@/components/BreadCrumbs'
import NavTabBar from '@/components/NavTabBar'
import DependenciesTile from '@/pages/Task/Dependencies-Tile'
import DetailsTile from '@/pages/Task/Details-Tile'
import SubPageNav from '@/layouts/SubPageNav'
import TaskRunHeartbeatTile from '@/pages/Task/TaskRunHeartbeat-Tile'
import TaskRunTableTile from '@/pages/Task/TaskRunTable-Tile'
import TileLayoutAlternate from '@/layouts/TileLayout-Alternate'
import TileLayoutFull from '@/layouts/TileLayout-Full'

export default {
  metaInfo() {
    return {
      title: this.task ? `Task | ${this.task?.name}` : null
    }
  },
  components: {
    BreadCrumbs,
    DependenciesTile,
    DetailsTile,
    NavTabBar,
    SubPageNav,
    TaskRunHeartbeatTile,
    TaskRunTableTile,
    TileLayoutAlternate,
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
          name: 'Runs',
          target: 'runs',
          icon: 'pi-task-run'
        }
      ]
    }
  },
  computed: {
    dependencies() {
      if (!this.task) return []
      let upstream = this.task.upstream_edges.map(edge => {
        return {
          ...edge.upstream_task,
          downstream_edges: [],
          upstream_edges: []
        }
      })
      let downstream = this.task.downstream_edges.map(edge => {
        return {
          ...edge.downstream_task,
          downstream_edges: [],
          upstream_edges: [{ upstream_task: { id: this.taskId } }]
        }
      })

      return [this.task, ...upstream, ...downstream]
    },
    downstreamCount() {
      if (!this.task) return null
      return this.task.downstream_edges.length
    },
    taskId() {
      return this.$route.params.id
    },
    upstreamCount() {
      if (!this.task) return null
      return this.task.upstream_edges.length
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
          /* eslint-disable-next-line */
          query = 'runs'
          break
        default:
          break
      }
    }
  },
  mounted() {
    if (!this.$route.query || !this.$route.query.schematic) {
      this.$router
        .replace({
          query: {
            schematic: this.taskId
          }
        })
        .catch(e => e)
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
    task: {
      query: require('@/graphql/Task/task.gql'),
      loadingKey: 'loading',
      variables() {
        return {
          id: this.taskId
        }
      },
      update: data => data.task_by_pk
    },
    lastTaskRun: {
      query: require('@/graphql/Task/last-task-run.gql'),
      loadingKey: 'loading',
      variables() {
        return {
          id: this.taskId
        }
      },
      update: data => data?.task_run?.[0]
    }
  }
}
</script>

<template>
  <v-sheet color="appBackground">
    <SubPageNav icon="pi-task" page-type="Task">
      <span
        slot="page-title"
        :style="
          loading !== 0
            ? {
                display: 'block',
                height: '28px',
                overflow: 'hidden',
                width: '400px'
              }
            : $vuetify.breakpoint.smAndDown && {
                display: 'inline'
              }
        "
      >
        <span v-if="loading === 0">
          {{ task.name }}
        </span>
        <span v-else style="width: 500px;">
          <v-skeleton-loader type="heading" tile></v-skeleton-loader>
        </span>
      </span>

      <span
        slot="breadcrumbs"
        :style="
          loading !== 0
            ? {
                display: 'block',
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
          v-if="task && loading === 0"
          :crumbs="[
            {
              route: {
                name: 'project',
                params: { id: task.flow.project.id }
              },
              text: task.flow.project.name
            },
            {
              route: {
                name: 'flow',
                params: { id: task.flow.id }
              },
              text: task.flow.name
            }
          ]"
        ></BreadCrumbs>
        <v-skeleton-loader v-else type="text" />
      </span>
      <span slot="tabs" style="width: 100%;"
        ><NavTabBar :tabs="tabs" page="flow"
      /></span>
    </SubPageNav>

    <v-tabs-items
      v-model="tab"
      class="px-6 mx-auto tabs-border-bottom tab-full-height"
      style="max-width: 1440px;"
      :style="
        $vuetify.breakpoint.mdAndUp ? 'padding-top: 130px' : 'padding-top: 80px'
      "
    >
      <v-tab-item
        value="runs"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <TileLayoutFull>
          <TaskRunTableTile
            slot="row-2-tile"
            :task-id="taskId"
            :loading="loading > 0"
          />
        </TileLayoutFull>
      </v-tab-item>

      <v-tab-item
        class="pa-0"
        value="overview"
        transition="quick-fade"
        reverse-transition="quick-fade"
      >
        <TileLayoutAlternate>
          <DetailsTile
            slot="col-1-tile-1"
            :task="task"
            :last-run="lastTaskRun"
            :loading="loading > 0"
          />

          <TaskRunHeartbeatTile slot="col-1-tile-2" :task-id="taskId" />

          <DependenciesTile
            slot="row-2-tile-1"
            :downstream-count="downstreamCount"
            :loading="loading > 0"
            :flow="task ? task.flow : null"
            :tasks="dependencies"
            :upstream-count="upstreamCount"
          />
        </TileLayoutAlternate>
      </v-tab-item>
    </v-tabs-items>

    <v-bottom-navigation v-if="$vuetify.breakpoint.smAndDown" fixed>
      <v-btn @click="tab = 'overview'">
        Overview
        <v-icon>view_module</v-icon>
      </v-btn>

      <v-btn @click="tab = 'runs'">
        Runs
        <v-icon>pi-task-run</v-icon>
      </v-btn>

      <!-- <v-btn disabled @click="tab = 'analytics'">
        Analytics
        <v-icon>insert_chart_outlined</v-icon>
      </v-btn> -->
    </v-bottom-navigation>
  </v-sheet>
</template>
