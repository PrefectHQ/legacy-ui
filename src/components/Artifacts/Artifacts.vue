<script>
import Artifact from '@/components/Artifacts/Artifact'

export default {
  components: {
    Artifact
  },
  props: {
    flowRunId: {
      type: String,
      required: false,
      default: () => null
    },
    taskRunIds: {
      type: Array,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      artifact: null,
      expanded: [],
      loadingKey: 0
    }
  },
  computed: {
    loading() {
      return !this.artifacts && this.loadingKey > 0
    },
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
    },
    onIntersect([entry]) {
      this.$apollo.queries.artifacts.skip = !entry.isIntersecting
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
      loadingKey: 'loadingKey',
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
      loadingKey: 'loadingKey',
      update: data => data.task_run?.map(t => t.id) || null
    }
  }
}
</script>

<template>
  <v-row no-gutters>
    <v-col>
      <div
        v-if="artifacts && artifacts.length > 0"
        class="d-flex align-center justify-center"
      >
        <v-btn icon :disabled="artifact == 0" @click="decrement">
          <v-icon large>arrow_left</v-icon>
        </v-btn>
        <v-item-group v-model="artifact" class="text-center my-2" mandatory>
          <v-item
            v-for="a in artifacts"
            :key="a.id"
            v-slot="{ active, toggle }"
          >
            <v-tooltip bottom>
              <template #activator="{ on }">
                <v-btn :input-value="active" icon @click="toggle" v-on="on">
                  <v-icon :x-large="active" color="primary">
                    fiber_manual_record
                  </v-icon>
                  <v-scale-transition>
                    <v-icon
                      v-if="active"
                      color="white"
                      class="position-absolute center-absolute"
                    >
                      fingerprint
                    </v-icon>
                  </v-scale-transition>
                </v-btn>
              </template>
              <div>
                <div class="text-h6">
                  {{ a.task_run.task.name }}
                </div>
                <div v-if="a.task_run.name" class="text-subtitle-1">
                  {{ a.task_run.name }}
                </div>
              </div>
            </v-tooltip>
          </v-item>
        </v-item-group>
        <v-btn
          icon
          :disabled="!artifacts || artifact == artifacts.length - 1"
          @click="increment"
        >
          <v-icon large>arrow_right</v-icon>
        </v-btn>
      </div>
      <div v-else-if="loading" class="position-absolute center-absolute">
        <v-progress-circular
          v-if="loading"
          color="primary"
          indeterminate
          size="150"
          width="10"
        />
      </div>
      <div
        v-else
        class="text-center position-absolute center-absolute text-h5 utilGrayDark--text"
        style="z-index: 1;"
      >
        This run has no
        <span class="font-weight-medium">
          <v-icon x-small color="primary" class="ml-1">
            fas fa-fingerprint
          </v-icon>
          Artifacts</span
        >! You can learn how to generate artifacts from your flow/task in the
        <a
          href="https://docs.prefect.io/api/latest/backend/artifacts.html"
          target="_blank"
        >
          Artifacts API Docs</a
        >.
      </div>

      <v-window v-model="artifact" class="artifact-container">
        <v-window-item
          v-for="a in artifacts"
          :key="a.id"
          class="h-100"
          transition="quick-fade"
          reverse-transition="quick-fade"
        >
          <v-card class="artifact-card pa-0" flat outlined>
            <v-card-title class="artifact-card-title">
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
                  class="text-overline utilGrayMid--text"
                  style="line-height: 1rem;"
                >
                  Artifact
                </div>
                <div class="text-h4">
                  {{ a.task_run.name ? a.task_run.name : a.task_run.task.name }}
                </div>
              </div>
            </v-card-title>
            <v-card-text class="pt-10">
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
    background-color: var(--v-appForeground-base);
    position: sticky;
    top: 0;
    z-index: 2;
    box-shadow: 0 2px 4px -1px rgb(0 0 0 / 20%), 0 4px 5px 0 rgb(0 0 0 / 14%),
      0 1px 10px 0 rgb(0 0 0 / 12%) !important;
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
