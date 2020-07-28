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
  computed: {},
  watch: {},
  methods: {
    failedRuns(failure) {
      const failedRuns = failure.filter(run => {
        return run.state === 'Failed'
      })
      return failedRuns.length
    },
    totalRuns(failure) {
      return failure.length
    },
    flowName(task) {
      return task[0].flow?.name
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
      error() {
        this.queryError = true
      },
      pollInterval: 30000,
      update: data => {
        return data.task
      }
    }
  }
}
</script>

<template>
  <div v-if="loading" class="loading apollo"
    ><v-skeleton-loader key="skeleton" type="list-item-three-line">
    </v-skeleton-loader
  ></div>
  <!-- Error -->
  <div v-else-if="queryError"
    ><v-list-item class="text-truncate">
      <v-list-item-title class="subtitle-2 red--text">
        An error occurred fetching this task information.
      </v-list-item-title></v-list-item
    ></div
  ><!-- Result -->
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
            >{{ failure.task.name }} ({{ flowName(task) }})
          </router-link>
        </v-list-item-title>

        <v-list-item-subtitle>
          {{ failedRuns(task[0].task_runs) }}
          /
          {{ totalRuns(task[0].task_runs) }}
          Runs failed
        </v-list-item-subtitle>
      </v-list-item-content>
      <v-list-item-avatar><v-icon>arrow_right</v-icon></v-list-item-avatar>
    </v-list-item>
  </div>
  <!-- No result -->
  <div v-else class="no-result apollo"
    ><v-skeleton-loader key="skeleton" type="list-item-three-line">
    </v-skeleton-loader
  ></div>
</template>
