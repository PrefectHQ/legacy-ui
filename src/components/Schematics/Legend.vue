<script>
export default {
  props: {
    tasks: { type: Array, required: true }
  },
  computed: {
    states() {
      // Reduce to just states
      // create a set (dedupe) from the states array
      return [...new Set(this.tasks?.map(t => t.state).sort())]
    }
  }
}
</script>

<template>
  <v-card tile min-width="200" max-width="200">
    <v-card-text class="pa-0" style="overflow: hidden;">
      <height-transition>
        <v-list-item v-for="state in states" :key="state">
          <v-list-item-avatar class="my-0" tile>
            <v-icon :color="state">fas fa-square-full</v-icon>
          </v-list-item-avatar>
          <v-list-item-content>
            <v-list-item-title class="body-2">
              {{ state }}
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </height-transition>
    </v-card-text>
  </v-card>
</template>

<style lang="scss">
//
//
</style>
