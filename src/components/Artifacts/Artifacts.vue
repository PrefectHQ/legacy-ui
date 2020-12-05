<script>
import Artifact from '@/components/Artifacts/Artifact'

export default {
  components: {
    Artifact
  },
  props: {
    // Get all -1 mi task runs
    flowRunId: {
      type: String,
      required: false,
      default: () => null
    },
    // Get first 5 mapped task run ids
    taskRunIds: {
      type: Array,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      artifact: null,
      expanded: []
    }
  },
  computed: {
    taskRunIds_() {
      return this.taskRunIds || this.ids
    }
  },
  methods: {
    decrement() {
      this.artifact--
    },
    increment() {
      this.artifact++
    }
  },
  apollo: {
    artifacts: {
      query: require('@/graphql/Artifacts/task-run-artifacts.gql'),
      variables() {
        return {
          taskRunIds: this.taskRunIds_
        }
      },
      skip() {
        return !this.taskRunIds_
      },
      pollInterval: 10000,
      update: data =>
        [...(data.task_run_artifact || [])].sort(
          (a, b) => new Date(a.created) - new Date(b.created)
        )
    },
    ids: {
      query: require('@/graphql/Artifacts/task-run-ids.gql'),
      variables() {
        return {
          where: {
            flow_run_id: { _eq: this.flowRunId }
          },
          limit: null, // We'll introduce limits and offsets later when we begin server-side pagination for artifacts
          offset: null
        }
      },
      skip() {
        return this.taskRunIds
      },
      update: data => data.task_run?.map(t => t.id) || null
    }
  }
}
</script>

<template>
  <v-row no-gutters>
    <v-col>
      <div class="d-flex align-center justify-center">
        <v-btn icon :disabled="artifact == 0" @click="decrement">
          <v-icon large>arrow_left</v-icon>
        </v-btn>
        <v-item-group v-model="artifact" class="text-center my-2" mandatory>
          <v-item
            v-for="a in artifacts"
            :key="a.id"
            v-slot="{ active, toggle }"
          >
            <v-btn :input-value="active" icon @click="toggle">
              <v-icon :x-large="active" color="primary">
                fiber_manual_record
              </v-icon>
            </v-btn>
          </v-item>
        </v-item-group>
        <v-btn
          icon
          :disabled="artifact == artifacts.length - 1"
          @click="increment"
        >
          <v-icon large>arrow_right</v-icon>
        </v-btn>
      </div>

      <v-window v-model="artifact" class="artifact-container">
        <v-window-item
          v-for="a in artifacts"
          :key="a.id"
          class="h-100"
          transition="quick-fade"
          reverse-transition="quick-fade"
        >
          <v-card class="artifact-card pa-0" tile>
            <v-card-title class="artifact-card-title white">
              <div class="position-relative">
                <v-icon x-large color="primary">fiber_manual_record</v-icon>
                <v-icon
                  class="position-absolute center-absolute"
                  small
                  color="white"
                >
                  fas fa-fingerprint
                </v-icon>
              </div>
              <div>
                <div
                  class="overline grey--text text--darken-1"
                  style="line-height: 1rem;"
                >
                  Artifact
                </div>
                <div class="text-h4">
                  {{ a.task_run.name ? a.task_run.name : a.task_run.task.name }}
                </div>
              </div>
            </v-card-title>
            <v-card-text>
              <v-fade-transition mode="out-in">
                <Artifact :artifact="a" />
              </v-fade-transition>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>
    </v-col>
  </v-row>
</template>

<style lang="scss" scoped>
.artifact-container {
  height: calc(100vh - 400px);
  min-height: 400px;
}

.artifact-card {
  height: auto;
  max-height: 100%;
  overflow: scroll;
  position: relative;
  transition: height 250ms ease-in-out;

  .artifact-card-title {
    position: sticky;
    top: 0;
    z-index: 1;
  }
}

.artifact-selector {
  max-height: calc(100%);
}

.h-100 {
  height: 100%;
}

.center-absolute {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
