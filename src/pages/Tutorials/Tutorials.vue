<script>
import { mapGetters } from 'vuex'
import { parser, getRoutes } from '@/utils/markdownParser'
import '@/styles/atelier-sulphurpool-light.css'
/* eslint-disable vue/no-v-html */

export default {
  data() {
    return {
      routes: getRoutes()
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant'])
  },
  mounted() {
    const path = `/${this.tenant.slug}/tutorial/${this.routes[0].name}`
    if (this.$route.path !== path) this.$router.push(path)
  },
  methods: {
    mdParser(md) {
      return parser(md)
    },

    sentenceCasing(str) {
      return str
        .split(' ')
        .map(word => word.replace(word[0], word[0].toUpperCase()))
        .join(' ')
    }
  }
}
</script>

<template>
  <v-container>
    <v-navigation-drawer
      :mini-variant="$vuetify.breakpoint.smAndDown"
      width="280"
      clipped
      permanent
      left
      fixed
      touchless
      :style="{ top: $vuetify.breakpoint.smAndDown ? '56px' : '64px' }"
    >
      <v-list>
        <v-list-group
          v-for="(item, index) in routes"
          :key="index"
          :value="true"
          no-action
          sub-group
        >
          <template #activator>
            <v-list-item-content>
              <v-list-item-title>{{
                sentenceCasing(item.name.replace(/-/g, ' '))
              }}</v-list-item-title>
            </v-list-item-content>
          </template>

          <v-list-item
            v-for="(child, i) in item.children"
            :key="i"
            link
            :to="{
              name: 'tutorial',
              params: { tenant: tenant.slug, id: child.file },
              hash: child.name
            }"
          >
            <v-list-item-title class="links">{{
              sentenceCasing(child.name.substring(1).replace(/-/g, ' '))
            }}</v-list-item-title>
          </v-list-item>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>

    <div
      :class="{
        'sm-and-down-left-padding': $vuetify.breakpoint.smAndDown,
        'sm-and-up-left-padding': $vuetify.breakpoint.smAndUp
      }"
      style="min-height: 100%;"
    >
      <div
        v-if="$route.params.id"
        class="md"
        v-html="mdParser(require(`./Markdown/${$route.params.id}.md`))"
      >
      </div>

      <v-fade-transition mode="out-in">
        <router-view></router-view>
      </v-fade-transition>
    </div>
  </v-container>
</template>

<style lang="scss" scoped>
.container {
  background: #fff;
}

.cursor-point {
  cursor: pointer;
}

.sm-and-up-left-padding {
  // Match left padding with User Settings sidebar width
  padding-left: 286px;
  padding-right: 56px;
}

.sm-and-down-left-padding {
  // Match left padding with collapsed User Settings sidebar width
  padding-left: 56px;
}

// stylelint-disable
.links {
  font-family: Roboto, sans-serif;
  word-wrap: break-word; /* IE 5.5-7 */
  white-space: -moz-pre-wrap; /* Firefox 1.0-2.0 */
  white-space: pre-wrap;
}

// stylelint-enable
</style>
