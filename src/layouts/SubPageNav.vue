<script>
export default {
  props: {
    icon: {
      type: String,
      required: false,
      default: () => null
    },
    pageType: {
      type: String,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      pageScrolled: false
    }
  },
  methods: {
    scrolled() {
      this.pageScrolled = window.scrollY > 30
    }
  }
}
</script>

<template>
  <v-app-bar
    v-scroll="scrolled"
    :elevation="
      pageScrolled && (!$slots.tabs || $vuetify.breakpoint.smAndDown)
        ? '4'
        : '0'
    "
    height="80"
    color="appBackground"
    class="pb-3"
    style="
    position: fixed;
    width: 100%;
    z-index: 5;"
  >
    <v-row
      no-gutters
      class="d-flex align-center mx-auto"
      style="max-width: 1440px;"
    >
      <v-col
        :sm="$slots['page-actions'] ? 6 : 12"
        class="d-flex align-end justify-space-between"
      >
        <div class="mr-2">
          <v-icon x-large color="blue-grey lighten-4">{{ icon }}</v-icon>
        </div>
        <div style="width: inherit;">
          <div>
            <span v-if="$slots.breadcrumbs" style="font-size: 0.875rem;">
              <slot name="breadcrumbs"></slot>
            </span>
            <slot v-if="$slots['page-type']" name="page-type"></slot>
            <span v-else class="overline">{{ pageType }}</span>
          </div>
          <div class="headline">
            <slot name="page-title"></slot>
          </div>
        </div>
      </v-col>
      <v-col
        v-if="$slots['page-actions'] && $vuetify.breakpoint.smAndUp"
        cols="12"
        sm="6"
        class="align-self-end text-right"
        :class="$vuetify.breakpoint.smAndDown ? 'text-center' : ''"
      >
        <slot name="page-actions"></slot>
      </v-col>
    </v-row>
    <template v-if="$slots.tabs && $vuetify.breakpoint.mdAndUp" slot="extension"
      ><slot name="tabs"></slot
    ></template>
    <template
      v-if="$slots['page-actions'] && $vuetify.breakpoint.xsOnly"
      slot="extension"
      ><slot name="page-actions"></slot
    ></template>
  </v-app-bar>
</template>
