<script>
export default {
  props: {
    icon: {
      type: String,
      required: false,
      default: () => ''
    },
    params: {
      type: Object,
      required: false,
      default: () => {}
    },
    iconClass: {
      type: String,
      required: false,
      default: () => ''
    },
    iconColor: {
      type: String,
      required: false,
      default: () => ''
    },
    loading: {
      type: Boolean,
      required: false,
      default: () => false
    },
    subtitle: {
      type: String,
      required: false,
      default: () => null
    },
    title: {
      type: String,
      required: false,
      default: () => ''
    }
  }
}
</script>

<template>
  <div>
    <v-list-item dense class="px-0" :to="params">
      <v-list-item-avatar class="mr-2" tile>
        <div v-if="$slots['icon']">
          <slot name="icon" />
        </div>
        <v-icon v-else :color="iconColor" :class="iconClass">
          {{ icon }}
        </v-icon>
      </v-list-item-avatar>
      <v-list-item-content class="position: relative;">
        <v-list-item-title class="text-h6 pb-1">
          <div v-if="$slots['title']">
            <slot name="title" />
          </div>
          <div v-else>
            <div v-if="!loading">
              {{ title }}
            </div>
            <v-skeleton-loader v-else type="heading" tile></v-skeleton-loader>
          </div>
          <div class="action-slot d-flex align-center justify-end">
            <slot name="state-filter" />
            <slot name="action" />
          </div>
        </v-list-item-title>
        <div
          v-if="$slots['subtitle'] || subtitle"
          class="text-subtitle-2 utilGrayDark--text text-caption position-absolute font-weight-medium"
          style="bottom: 2px;"
        >
          <slot v-if="$slots['subtitle']" name="subtitle" />
          <div v-else>{{ subtitle }}</div>
        </div>

        <v-list-item-subtitle v-if="$slots['badge']">
          <slot name="badge" />
        </v-list-item-subtitle>
      </v-list-item-content>
    </v-list-item>

    <v-divider class="ml-12 mr-2"></v-divider>
  </div>
</template>

<style lang="scss" scoped>
.action-slot {
  height: 100%;
  position: absolute;
  right: 0;
  top: 0;
}
</style>
