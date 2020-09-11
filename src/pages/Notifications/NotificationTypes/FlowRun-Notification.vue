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
  }
}
</script>

<template>
  <v-list-item-content v-if="dense">
    <v-list-item-title>
      {{ content.event.flow.name }}:
      <span :class="`${content.event.state}--text`">{{
        content.event.state
      }}</span>
    </v-list-item-title>
    <v-list-item-subtitle v-if="timestamp">
      {{ timestamp }}
    </v-list-item-subtitle>
  </v-list-item-content>

  <v-list-item-content v-else>
    <v-list-item-title>
      {{ content.event.flow.name }}
    </v-list-item-title>
    <v-list-item-subtitle>
      Entered a new state: {{ content.event.state }}
    </v-list-item-subtitle>
  </v-list-item-content>
</template>
