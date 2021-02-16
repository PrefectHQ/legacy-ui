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
    maxWidth: {
      type: [String, Number],
      required: false,
      default: '320px'
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
  <v-menu v-model="open" offset-y :close-on-content-click="false" open-on-hover>
    <template #activator="{ on }">
      <div class="d-inline-flex align-start" v-on="on">
        <v-icon x-small @focus="open = true" @blur="open = false">
          {{ icon }}
        </v-icon>
      </div>
    </template>
    <v-card tile class="pa-0" :max-width="maxWidth">
      <v-card-text class="pb-0 text-body-2">
        <slot>
          {{ content }}
        </slot>
      </v-card-text>
      <v-card-actions class="pt-0">
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
