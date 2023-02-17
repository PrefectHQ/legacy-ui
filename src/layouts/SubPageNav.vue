<script>
import { mapGetters } from 'vuex'
import TutorialBanner from '@/components/TutorialBanner'
import EndOfLifeBanner from '@/components/EndOfLifeBanner'

export default {
  // components: { TutorialBanner },
  components: { EndOfLifeBanner, TutorialBanner },
  props: {
    hideBanners: {
      type: Boolean,
      required: false,
      default: () => false
    },
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
      pageScrolled: false,
      unsubscribeFlows: null,
      unwatchFlows: null
    }
  },
  computed: {
    ...mapGetters('license', ['license', 'planType']),
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('data', ['flows']),
    canShowBanners() {
      return (
        !this.hideBanners &&
        !this.$vuetify.breakpoint.smAndDown &&
        !this.pageScrolled
      )
    },
    shouldShowTutorialBanner() {
      return (
        this.canShowBanners && this.flows != null && this.flows.length === 0
      )
    },
    shouldShowEndOfLifeBanner() {
      return (
        this.canShowBanners &&
        this.isCloud &&
        (this.planType('FREE') || this.planType('STARTER'))
      )
    }
  },
  async created() {
    this.unsubscribeFlows = await this.$store.dispatch(
      'polling/subscribe',
      'flows'
    )
    this.unwatchFlows = this.$watch('flows', this.flowsChanged)
  },
  beforeDestroy() {
    this.unsubscribeFlows()
  },
  methods: {
    scrolled() {
      this.pageScrolled = window.scrollY > 30
    },
    flowsChanged(flows) {
      if (flows.length > 0) {
        this.unsubscribeFlows()
        this.unwatchFlows()
      }
    }
  }
}
</script>

<template>
  <div>
    <EndOfLifeBanner v-if="shouldShowEndOfLifeBanner" />
    <TutorialBanner v-if="shouldShowTutorialBanner" />
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
      style="position: fixed; width: 100%; z-index: 6"
    >
      <v-row
        no-gutters
        class="d-flex align-center mx-auto"
        :class="{
          'justify-center': $vuetify.breakpoint.smAndDown
        }"
        style="height: 64px"
      >
        <v-col :sm="$slots['page-actions'] ? 6 : 12" class="d-flex align-end">
          <div class="mr-2">
            <v-icon x-large color="blue-grey lighten-4">{{ icon }}</v-icon>
          </div>
          <div>
            <div>
              <span v-if="$slots.breadcrumbs" style="font-size: 0.875rem">
                <slot name="breadcrumbs"></slot>
              </span>
              <slot v-if="$slots['page-type']" name="page-type"></slot>
              <span v-else class="text-overline">{{ pageType }}</span>
            </div>
            <div class="text-h5 mt-n1">
              <slot name="page-title"></slot>
            </div>
          </div>
        </v-col>
        <v-col
          v-if="$slots['page-actions'] && $vuetify.breakpoint.smAndUp"
          cols="12"
          sm="6"
          class="align-self-end text-right"
          :class="{
            'text-center': $vuetify.breakpoint.smAndDown
          }"
        >
          <slot name="page-actions"></slot>
        </v-col>
      </v-row>
      <template
        v-if="$slots.tabs && $vuetify.breakpoint.mdAndUp"
        slot="extension"
        ><slot name="tabs"></slot
      ></template>
      <template
        v-if="$slots['page-actions'] && $vuetify.breakpoint.xsOnly"
        slot="extension"
        ><slot name="page-actions"></slot
      ></template>
    </v-toolbar>
  </div>
</template>
