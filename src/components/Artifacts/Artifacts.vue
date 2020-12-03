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
      expanded: []
    }
  },
  computed: {
    taskRunIds_() {
      return this.taskRunIds || this.ids
    }
  },
  methods: {
    close(id) {
      let i = this.expanded.findIndex(e => e == id)
      this.expanded.splice(i, 1)
    },
    expand(id) {
      this.expanded.push(id)
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
          limit: 10,
          offset: 0
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
  <!-- <div>
    <v-lazy
      v-for="a in artifacts"
      :key="a.id"
      :options="{
        threshold: 0.75
      }"
      min-height="40px"
      transition="fade"
    >
      <v-list-item>
        {{ a.task_run.name ? a.task_run.name : a.task_run.task.name }} Artifact
      </v-list-item>
      <Artifact v-if="false" :artifact="a" />
    </v-lazy>
  </div> -->

  <div class="grid my-4">
    <div
      v-for="a in artifacts"
      :key="a.id"
      class="grid-container"
      :class="{ 'grid-container-large': expanded.includes(a.id) }"
    >
      <v-card
        class="artifact-card text-truncate"
        :class="{ 'artifact-card-large': expanded.includes(a.id) }"
        :style="{
          'border-left': '4px solid var(--v-primary-base) !important'
        }"
        tile
      >
        <v-fade-transition mode="out-in">
          <v-card-text
            v-if="!expanded.includes(a.id)"
            style="height: 100%;"
            @click="expand(a.id)"
          >
            {{ a.task_run.name ? a.task_run.name : a.task_run.task.name }}
            Artifact
          </v-card-text>
          <v-card-text v-else>
            <v-btn
              icon
              absolute
              style="
                right: 25px;
                top: 25px;
            "
              @click="close(a.id)"
            >
              <v-icon>close</v-icon>
            </v-btn>
            <Artifact :artifact="a" />
          </v-card-text>
        </v-fade-transition>
      </v-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$cellsize: 225px;
$guttersize: 24px;

.grid {
  column-gap: $guttersize;
  display: grid;
  grid-auto-flow: dense;
  grid-auto-rows: $cellsize;
  grid-template-columns: repeat(auto-fill, $cellsize);
  justify-content: center;
  row-gap: $guttersize;
}

.grid-container {
  grid-column: span 1;
  grid-row: span 1;
  overflow: visible;
  position: relative;

  &.grid-container-large {
    grid-column: 1 / -1;
    grid-row: span 3;
  }
}

.artifact-card {
  height: 100%;
  left: 0;
  max-height: $cellsize + $guttersize;
  max-width: $cellsize + $guttersize;
  min-height: $cellsize;
  min-width: $cellsize;
  position: absolute;
  top: 0;
  transition: all 250ms;
  width: 100%;

  &.artifact-card-large {
    max-height: $cellsize * 3 + $guttersize * 3;
    max-width: 100%;
    min-height: $cellsize * 3;
    min-width: 100%;
  }
}
</style>
