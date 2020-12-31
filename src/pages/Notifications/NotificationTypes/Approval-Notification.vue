<script>
export default {
  props: {
    content: {
      type: Object,
      required: true
    },
    dense: {
      type: Boolean,
      required: false,
      default: () => false
    },
    timestamp: {
      type: String,
      required: false,
      default: () => null
    }
  },
  computed: {
    itemTitle() {
      return `${this.task?.flow?.name} has a
          paused run that requires approval to resume.`
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
  <v-list-item-content v-if="dense">
    <v-list-item-title>
      <div v-if="task">
        <truncate :content="itemTitle">
          <span class="font-weight-medium">{{ task.flow.name }}</span> has a
          paused run that requires approval to resume.
        </truncate>
      </div>
      <div v-else>
        <v-skeleton-loader type="heading" tile></v-skeleton-loader>
      </div>
    </v-list-item-title>
    <v-list-item-subtitle v-if="timestamp">
      {{ timestamp }}
    </v-list-item-subtitle>
  </v-list-item-content>

  <v-list-item-content v-else>
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
