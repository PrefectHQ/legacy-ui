<script>
import { parser } from '@/utils/markdownParser'

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
    renderedContents() {
      return parser(this.content.message)
    }
  }
}
</script>

<template>
  <v-list-item-content v-if="dense">
    <v-list-item-title>
      <truncate :content="content.title">
        {{ content.title }}
      </truncate>
    </v-list-item-title>
    <v-list-item-subtitle v-if="timestamp">
      {{ timestamp }}
    </v-list-item-subtitle>
  </v-list-item-content>

  <v-list-item-content v-else>
    <v-list-item-title>
      {{ content.title }}
    </v-list-item-title>
    <v-list-item-subtitle>
      {{ renderedContents }}
    </v-list-item-subtitle>
  </v-list-item-content>
</template>
