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
      let query = {}
      if (val) {
        if (this.$route.params.id) {
          query = { [val]: this.$route.params.id } // schematic uses this
        }
        query = { [val]: '' }
      }
      this.$router
        .replace({
          query: query
        })
        .catch(e => e)
    },
    $route() {
      this.tab = this.getTab()
    }
  },
  methods: {
    getTab() {
      if (Object.keys(this.$route.query).length != 0) {
        return Object.keys(this.$route.query)[0]
      }
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
      :disabled="tb.disabled"
    >
      <v-icon left :size="tb.iconSize || 'medium'">{{ tb.icon }}</v-icon>
      {{ tb.name }}
    </v-tab>
  </v-tabs>
</template>
