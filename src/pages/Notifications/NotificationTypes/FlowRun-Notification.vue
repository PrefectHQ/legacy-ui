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
    stateClass() {
      const lightStates = [
        'Submitted',
        'Cancelled',
        'Cancelling',
        'Queued',
        'Pending'
      ]

      const textColor = lightStates.includes(this.content.event.state)
        ? 'black--text'
        : 'white--text'

      return [this.content.event.state, textColor]
    },
    itemTitle() {
      return ` ${this.content.event.flow.name}: ${this.content.event.state}`
    }
  }
}
</script>

<template>
  <v-list-item-content v-if="dense">
    <v-list-item-title>
      <truncate :content="itemTitle">
        {{ content.event.flow.name }}:
        <span
          :class="{
            [content.event.state]: true,
            'white--text': content.event.state !== 'Submitted'
          }"
          class="px-2 rounded-pill d-inline-block text-body-2"
        >
          {{ content.event.state }}
        </span>
      </truncate>
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
