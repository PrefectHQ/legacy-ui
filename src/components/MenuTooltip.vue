<script>
export default {
  props: {
    content: {
      type: String,
      required: false,
      default: null
    },
    hideClose: {
      type: Boolean,
      required: false,
      default: false
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
    nudgeBottom: {
      type: String,
      required: false,
      default: null
    },
    nudgeLeft: {
      type: String,
      required: false,
      default: null
    },
    nudgeRight: {
      type: String,
      required: false,
      default: null
    },
    nudgeTop: {
      type: String,
      required: false,
      default: null
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
    top: {
      type: Boolean,
      required: false,
      default: false
    },
    transition: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      open: false
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
    :top="top"
    :nudge-bottom="nudgeBottom"
    :nudge-top="nudgeTop"
    :nudge-left="nudgeLeft"
    :nudge-right="nudgeRight"
    :max-width="maxWidth"
    open-on-hover
    tile
    :transition="transition"
    class="elevation-1"
  >
    <template #activator="{ on }">
      <span v-on="on">
        <slot name="activator">
          <div class="d-inline-flex align-start" :class="iconClass">
            <v-icon :color="iconColor" x-small @focus="open = true">
              {{ icon }}
            </v-icon>
          </div>
        </slot>
      </span>
    </template>
    <v-card tile class="pa-0">
      <v-card-text class="pa-4 text-body-2">
        <slot>
          {{ content }}
        </slot>
      </v-card-text>
      <v-card-actions
        v-if="!hideClose"
        class="pa-2 flex-row-reverse justify-space-between"
      >
        <v-btn
          class="text-none"
          color="primary"
          small
          text
          @click="open = false"
          >Close</v-btn
        >
        <slot name="actions" />
      </v-card-actions>
    </v-card>
  </v-menu>
</template>
