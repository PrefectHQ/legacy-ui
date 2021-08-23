<script>
export default {
  filters: {
    typeClass: val => val.split('.').pop()
  },
  props: {
    task: {
      type: Object,
      required: true
    }
  }
}
</script>

<template>
  <v-card-text class="pa-0 text-caption">
    <v-list-item
      dense
      class="py-2 pr-2 pl-5"
      :to="{ name: 'task', params: { id: task.id } }"
    >
      <v-list-item-content class="my-0 py-0">
        <v-list-item-subtitle class="text-caption mb-0">
          Task
        </v-list-item-subtitle>
        <v-list-item-title>
          {{ task.name }}
        </v-list-item-title>
      </v-list-item-content>

      <v-list-item-avatar class="text-body-2">
        <v-icon class="grey--text text--darken-2">
          arrow_right
        </v-icon>
      </v-list-item-avatar>
    </v-list-item>

    <v-divider></v-divider>

    <v-card-text class="pb-0 pl-3 pr-2 text-caption">
      <v-row>
        <v-col cols="6" class="pt-0">
          <span class="utilGrayDark--text">Max retries:</span>
        </v-col>
        <v-col cols="6" class="text-right pt-0">
          {{ task.max_retries }}
        </v-col>
      </v-row>

      <v-row v-if="task.max_retries > 0">
        <v-col cols="6" class="pt-0">
          <span class="utilGrayDark--text">Retry delay:</span>
        </v-col>
        <v-col cols="6" class="text-right pt-0">
          {{ task.retry_delay }}
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="6" class="pt-0">
          <span class="utilGrayDark--text">Class:</span>
        </v-col>
        <v-col cols="6" class="text-right pt-0">
          {{ task.type | typeClass }}
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="6" class="pt-0">
          <span class="utilGrayDark--text">Trigger:</span>
        </v-col>
        <v-col cols="6" class="text-right pt-0">
          {{ task.trigger | typeClass }}
        </v-col>
      </v-row>
    </v-card-text>
  </v-card-text>
</template>
