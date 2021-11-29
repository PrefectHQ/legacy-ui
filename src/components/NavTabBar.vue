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
    },
    paths: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      pageScrolled: false
    }
  },
  computed: {
    mainTabs() {
      return this.tabs.filter(tab => !tab.hidden && tab.align != 'right')
    },
    secondaryTabs() {
      return this.tabs.filter(tab => !tab.hidden && tab.align === 'right')
    },
    tab: {
      get() {
        const route = this.tabs.find(
          t => t.to?.path == this.$route.path || t.to?.name == this.$route.name
        )

        if (Object.keys(this.$route.query).length != 0) {
          return Object.keys(this.$route.query)[0]
        } else if (route) {
          return route.to.path || route.to.name
        }

        return 'overview'
      },
      set(value) {
        if (this.paths) return

        const query = { [value]: null }

        if (value && this.$route.query.version) {
          query.version = this.$route.query.version
        }

        this.$router.replace({ query }).catch()
      }
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
  <v-tabs
    v-model="tab"
    v-scroll="scrolled"
    class="mx-auto tabs-border-bottom tabs-border-top"
    :class="[
      $vuetify.breakpoint.smAndDown ? 'tabs-hidden' : '',
      pageScrolled ? 'elevation-4' : ''
    ]"
  >
    <v-tabs-slider color="blue"></v-tabs-slider>
    <template v-for="tb in mainTabs">
      <v-menu
        v-if="tb.cardText"
        :key="tb.target || (tb.to && (tb.to.name || tb.to.path))"
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
              :href="tb.target ? `#${tb.target}` : null"
              :to="tb.to ? tb.to : null"
              :class="{
                'tabs-hidden': $vuetify.breakpoint.smAndDown,
                'pr-2': tb.badgeText
              }"
              style="height: 100%;"
              :disabled="tb.disabled"
              :hidden="tb.hidden"
            >
              <v-icon left :size="tb.iconSize || 'medium'">
                {{ tb.icon }}
              </v-icon>
              {{ tb.name }}
              <v-badge
                v-if="tb.badgeText"
                color="codePink"
                class="text-none"
                :content="tb.badgeText"
                bottom
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
      <v-tab
        v-else
        :key="tb.target || (tb.to && (tb.to.name || tb.to.path))"
        :data-cy="`${page}-${tb.target}-tab`"
        :href="tb.target ? `#${tb.target}` : null"
        :to="tb.to ? tb.to : null"
        :class="{
          'tabs-hidden': $vuetify.breakpoint.smAndDown,
          'pr-2': tb.badgeText
        }"
        :disabled="tb.disabled"
      >
        <v-icon left :size="tb.iconSize || 'medium'">{{ tb.icon }}</v-icon>
        {{ tb.name }}
        <v-badge
          v-if="tb.badgeText"
          :color="tb.badgeColor || 'accentPink'"
          class="text-none"
          :class="{ disabled: tb.disabled }"
          :content="tb.badgeText"
          bottom
          inline
        ></v-badge>
      </v-tab>
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
