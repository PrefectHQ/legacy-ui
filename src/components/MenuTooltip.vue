<script>
export default {
  props: {
    content: {
      type: String,
      required: false,
      default: null
    },
    icon: {
      type: String,
      required: false,
      default: 'far fa-info-circle'
    },
    iconClass: {
      type: [String, Object, Array],
      required: false,
      default: null
    },
    iconColor: {
      type: String,
      required: false,
      default: null
    },
    maxWidth: {
      type: [String, Number],
      required: false,
      default: '320px'
    },
    offsetX: {
      type: Boolean,
      required: false,
      default: false
    },
    offsetY: {
      type: Boolean,
      required: false,
      default: true
    },
    hideClose: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      open: true
    }
  }
}
</script>

<template>
  <v-menu
    v-model="open"
    :offset-y="offsetY"
    :offset-x="offsetX"
    :close-on-content-click="false"
    open-on-hover
  >
    <template #activator="{ on }">
      <div class="d-inline-flex align-start" :class="iconClass" v-on="on">
        <v-icon
          :color="iconColor"
          x-small
          @focus="open = true"
          @blur="open = false"
        >
          {{ icon }}
        </v-icon>
      </div>
    </template>
    <v-card tile class="pa-0" :max-width="maxWidth">
      <v-card-text class="pa-4 text-body-2">
        <slot>
          {{ content }}
        </slot>
      </v-card-text>
      <v-card-actions v-if="!hideClose" class="pa-2">
        <v-spacer></v-spacer>
        <v-btn
          class="text-none"
          color="primary"
          small
          text
          @click="open = false"
          >Close</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-menu>
</template>
