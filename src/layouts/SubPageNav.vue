<script>
import TutorialBanner from '@/components/TutorialBanner'
export default {
  components: { TutorialBanner },
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
    },
    tenantSlug: {
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
  <v-toolbar
    v-scroll="scrolled"
    :elevation="
      pageScrolled && (!$slots.tabs || $vuetify.breakpoint.smAndDown)
        ? '4'
        : '0'
    "
    height="auto"
    color="appBackground"
    class="pb-3"
    style="
    position: fixed;
    width: 100%;
    z-index: 4;"
    >
      <v-row
        no-gutters
        class="d-flex align-center mx-auto"
        :class="{
          'justify-center': $vuetify.breakpoint.smAndDown
        }"
        style="height: 64px;
      max-width: 1440px;"
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
  </v-toolbar>
</template>
