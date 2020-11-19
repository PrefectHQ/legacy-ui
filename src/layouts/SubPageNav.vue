<script>
export default {
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
    style="
    position: fixed;
    width: 100%;
    z-index: 5;"
    ><span class="pr-2"><slot name="page-type"> </slot></span>
    <v-row
      no-gutters
      class="d-flex align-center mx-auto pb-3"
      style="max-width: 1440px;"
    >
      <v-col :sm="$slots['page-actions'] ? 8 : 12">
        <v-row>
          <v-col
            cols="12"
            class="d-flex align-center justify-space-between pb-1"
          >
            <div style="width: inherit;">
              <div>
                <span
                  v-if="$slots.breadcrumbs"
                  class="pl-2"
                  style="font-size: 0.875rem;"
                  ><slot name="breadcrumbs"></slot
                ></span>
              </div>
              <div class="headline"><slot name="page-title"></slot></div>
            </div>
          </v-col>
        </v-row>
      </v-col>
      <v-col
        v-if="$slots['page-actions']"
        cols="12"
        sm="4"
        class="align-self-end text-right"
        :class="$vuetify.breakpoint.smAndDown ? 'text-center' : ''"
      >
        <slot name="page-actions"></slot>
      </v-col>
    </v-row>
    <template v-if="$slots.tabs && $vuetify.breakpoint.mdAndUp" slot="extension"
      ><slot name="tabs"></slot
    ></template>
  </v-app-bar>
</template>
