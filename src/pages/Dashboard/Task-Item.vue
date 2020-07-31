<script>
export default {
  components: {},
  props: {
    failure: {
      type: Object,
      required: true
    },
    heartbeat: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: 0,
      queryError: false
    }
  },
  computed: {
    flowName() {
      return this.flow[0]?.name
    }
  },
  watch: {},
  methods: {
    failedRuns(task) {
      const failedRuns = task?.task_runs?.filter(run => {
        return run.state === 'Failed'
      })
      return failedRuns?.length
    },
    totalRuns(task) {
      return task?.task_runs?.length
    }
  },
  apollo: {
    task: {
      query: require('@/graphql/Dashboard/failed-task.gql'),
      variables() {
        return { taskId: this.failure.task.id, heartbeat: this.heartbeat }
      },
      // skip: true,
      loadingKey: 'loading',
      pollInterval: 0,
      error() {
        this.queryError = true
      },
      update: data => {
        return data.task_by_pk
      }
    },
    flow: {
      query: require('@/graphql/Dashboard/flow-by-task.gql'),
      variables() {
        return { taskId: this.failure.task.id, heartbeat: this.heartbeat }
      },
      // skip: true,
      loadingKey: 'loading',
      pollInterval: 0,
      error() {
        this.queryError = true
      },
      update: data => {
        return data.flow
      }
    }
  }
}
</script>

<template>
  <div v-if="!task && loading" class="loading apollo"
    ><v-skeleton-loader key="skeleton" type="list-item-two-line">
    </v-skeleton-loader
  ></div>
  <!-- Error -->
  <div v-else-if="queryError"
    ><v-skeleton-loader key="skeleton" type="list-item-two-line">
    </v-skeleton-loader>
  </div>
  <!-- Result -->
  <div v-else-if="task" class="result apollo">
    <v-list-item
      class="text-truncate"
      :to="{
        name: 'task',
        params: { id: failure.task.id }
      }"
    >
      <v-list-item-content>
        <v-list-item-title class="subtitle-2">
          <router-link
            class="link"
            :to="{
              name: 'task',
              params: { id: failure.task.id }
            }"
          >
            {{ flowName }}
            <span class="font-weight-bold">
              <v-icon style="font-size: 12px;">
                chevron_right
              </v-icon>
            </span>
            {{ failure.task.name }}
          </router-link>
        </v-list-item-title>

        <v-list-item-subtitle>
          {{ failedRuns(task) }}
          /
          {{ totalRuns(task) }}
          Runs failed
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-avatar><v-icon>arrow_right</v-icon></v-list-item-avatar>
    </v-list-item>
  </div>
  <!-- No result -->
  <div v-else class="no-result apollo"
    ><v-skeleton-loader key="skeleton" type="list-item-two-line">
    </v-skeleton-loader
  ></div>
</template>
