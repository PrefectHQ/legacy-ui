<script>
import Artifact from '@/components/Artifacts/Artifact'

export default {
  components: {
    Artifact
  },
  props: {
    taskRunIds: {
      type: Array,
      required: true
    }
  },
  apollo: {
    artifacts: {
      query: require('@/graphql/TaskRun/task-run-artifacts.gql'),
      variables() {
        return {
          taskRunIds: this.taskRunIds
        }
      },
      pollInterval: 10000,
      update: data => data.task_run_artifact || []
    }
  }
}
</script>

<template>
  <div>
    <v-lazy
      v-for="artifact in artifacts"
      :key="artifact.id"
      :options="{
        threshold: 0.75
      }"
      min-height="40px"
      transition="fade"
    >
      <Artifact :artifact="artifact" />
    </v-lazy>
  </div>
</template>
