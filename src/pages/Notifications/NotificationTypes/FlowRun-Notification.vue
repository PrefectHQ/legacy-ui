<script>
export default {
  props: {
    content: {
      type: Object,
      required: true
    }
  }
}
</script>

<template>
  <v-list-item-content>
    <v-list-item-title>
      {{ content.event.flow.name }}
    </v-list-item-title>
    <v-list-item-subtitle>
      Entered a new state: {{ content.event.state }}
    </v-list-item-subtitle>
  </v-list-item-content>
</template>
