<script>
export default {
  props: {
    content: {
      type: Object,
      required: true
    }
  },
  apollo: {
    task: {
      query: require('@/graphql/Task/task.gql'),
      variables() {
        return {
          id: this.content.task_run.task_id
        }
      },
      loadingKey: 'loading',
      update: data => data?.task_by_pk
    }
  }
}
</script>

<template>
  <v-list-item-content>
    <v-list-item-title>
      <div v-if="task">
        <span class="font-weight-medium">{{ task.name }}</span> is paused and
        requires approval to resume.
      </div>
      <div v-else>
        <v-skeleton-loader type="heading" tile></v-skeleton-loader>
      </div>
    </v-list-item-title>
    <v-list-item-subtitle v-if="task">
      {{ task.flow.name }}
    </v-list-item-subtitle>
  </v-list-item-content>
</template>
