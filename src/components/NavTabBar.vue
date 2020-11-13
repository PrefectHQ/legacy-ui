<script>
export default {
  props: {
    tabs: {
      type: Array,
      required: true
    },
    page: {
      type: String,
      required: false,
      default: ''
    }
  },
  data() {
    return {
      tab: this.getTab()
    }
  },
  watch: {
    tab(val) {
      let tab = 'overview'

      switch (val) {
        case 'flows':
          tab = 'flows'
          break
        case 'agents':
          tab = 'agents'
          break
        default:
          break
      }

      if (!(tab in this.$route.query)) {
        this.$router.push(
          {
            name: this.$route.name,
            params: this.$route.params,
            query:
              tab == 'overview'
                ? null
                : {
                    [tab]: ''
                  }
          },
          () => {}
        )
      }
    },
    $route(val) {
      if (val.name == 'dashboard') {
        this.tab = this.getTab()
      }
    }
  },
  methods: {
    getTab() {
      if ('flows' in this.$route.query) return 'flows'
      if ('agents' in this.$route.query) return 'agents'
      return 'overview'
    }
  }
}
</script>

<template>
  <v-tabs
    v-model="tab"
    class="px-6 mx-auto tabs-border-bottom"
    :class="$vuetify.breakpoint.smAndDown ? 'tabs-hidden' : ''"
    style="max-width: 1440px;"
    light
  >
    <v-tabs-slider color="blue"></v-tabs-slider>
    <v-tab
      v-for="tb in tabs"
      :key="tb.target"
      :data-cy="`${page}-${tb.target}-tab`"
      :href="`#${tb.target}`"
      :class="$vuetify.breakpoint.smAndDown ? 'tabs-hidden' : ''"
      @click="$emit('update:tab', $event.target.value)"
    >
      <v-icon left :size="tb.iconSize || 'medium'">{{ tb.icon }}</v-icon>
      {{ tb.name }}
    </v-tab>
  </v-tabs>
</template>

<style lang="scss" scoped>
.arrow-position {
  bottom: 1px;
  position: relative;
}
</style>
