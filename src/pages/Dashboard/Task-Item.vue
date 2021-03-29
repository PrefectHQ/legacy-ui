<script>
export default {
  components: {},
  props: {
    failure: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: 0,
      queryError: false
    }
  },
  watch: {}
}
</script>

<template>
  <div class="result apollo">
    <v-list-item
      class="text-truncate"
      :to="{
        name: 'task-run',
        params: { id: failure.id }
      }"
    >
      <v-list-item-content>
        <v-list-item-title class="text-subtitle-2">
          <router-link
            class="link"
            :to="{
              name: 'task-run',
              params: { id: failure.id }
            }"
          >
            {{ failure.task.flow.name }}
            <span class="font-weight-bold">
              <v-icon style="font-size: 12px;">
                chevron_right
              </v-icon>
            </span>
            {{ failure.task.name }}
          </router-link>
        </v-list-item-title>
      </v-list-item-content>
      <v-list-item-avatar><v-icon>arrow_right</v-icon></v-list-item-avatar>
    </v-list-item>
  </div>
</template>
