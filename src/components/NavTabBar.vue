<script>
import ExternalLink from '@/components/ExternalLink'

export default {
  components: {
    ExternalLink
  },
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
      tab: this.getTab(),
      pageScrolled: false
    }
  },
  computed: {
    mainTabs() {
      return this.tabs.filter(tab => !tab.hidden && tab.align != 'right')
    },
    secondaryTabs() {
      return this.tabs.filter(tab => !tab.hidden && tab.align === 'right')
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
    },
    scrolled() {
      this.pageScrolled = window.scrollY > 30
    }
  }
}
</script>

<template>
  <v-tabs
    v-model="tab"
    v-scroll="scrolled"
    class="mx-auto tabs-border-bottom"
    :class="[
      $vuetify.breakpoint.smAndDown ? 'tabs-hidden' : '',
      pageScrolled ? 'elevation-4' : ''
    ]"
    style="max-width: 1440px;"
    light
  >
    <v-tabs-slider color="blue"></v-tabs-slider>
    <template v-for="tb in mainTabs">
      <v-tab
        v-if="!tb.cardText"
        :key="tb.target"
        :data-cy="`${page}-${tb.target}-tab`"
        :href="`#${tb.target}`"
        :class="$vuetify.breakpoint.smAndDown ? 'tabs-hidden' : ''"
        :disabled="tb.disabled"
      >
        <v-icon left :size="tb.iconSize || 'medium'">{{ tb.icon }}</v-icon>
        {{ tb.name }}
        <v-badge
          v-if="tb.badgeText"
          color="codePink"
          :content="tb.badgeText"
          bottom
          bordered
          inline
        ></v-badge>
      </v-tab>
      <v-menu
        v-else
        :key="tb.target"
        open-on-hover
        :close-on-click="false"
        :open-on-click="false"
        :close-on-content-click="false"
        offset-y
      >
        <template #activator="{on}">
          <div
            :style="tb.cardText && 'cursor: default; pointer-events: auto;'"
            v-on="on"
            @click.stop
          >
            <v-tab
              :data-cy="`${page}-${tb.target}-tab`"
              :href="`#${tb.target}`"
              :class="$vuetify.breakpoint.smAndDown ? 'tabs-hidden' : ''"
              :disabled="tb.disabled"
              :hidden="tb.hidden"
            >
              <v-icon left :size="tb.iconSize || 'medium'">{{
                tb.icon
              }}</v-icon>
              {{ tb.name }}
              <v-badge
                v-if="tb.badgeText"
                color="codePink"
                :content="tb.badgeText"
                bottom
                bordered
                inline
              ></v-badge>
            </v-tab>
          </div>
        </template>
        <v-card v-if="tb.cardText" tile class="pa-0" max-width="320">
          <v-card-title>
            <v-badge
              color="codePink"
              :content="tb.badgeText"
              bottom
              bordered
              inline
            >
              <v-icon left>{{ tb.icon }}</v-icon>
              {{ tb.name }}
            </v-badge>
          </v-card-title>
          <v-card-text>
            <div>
              {{ tb.cardText }}
              <ExternalLink :href="tb.cardLink">{{
                tb.cardLinkText
              }}</ExternalLink
              >!
            </div></v-card-text
          >
        </v-card>
      </v-menu>
    </template>

    <v-spacer />
    <v-tab
      v-for="tb in secondaryTabs"
      :key="tb.target"
      :data-cy="`${page}-${tb.target}-tab`"
      :href="`#${tb.target}`"
      :class="$vuetify.breakpoint.smAndDown ? 'tabs-hidden' : ''"
      :disabled="tb.disabled"
      :hidden="tb.hidden"
    >
      <v-icon left :size="tb.iconSize || 'medium'">{{ tb.icon }}</v-icon>
      {{ tb.name }}
    </v-tab>
  </v-tabs>
</template>
