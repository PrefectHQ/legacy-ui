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
      mini-variant-width="auto"
      width="300"
      clipped
      permanent
      left
      fixed
      touchless
      :style="{ top: $vuetify.breakpoint.smAndDown ? '56px' : '64px' }"
    >
      <v-list-item>
        <v-list-item-action>
          <v-icon class="blue--text accent-4">
            school
          </v-icon>
        </v-list-item-action>
        <v-list-item-content>
          <div class="font-weight-medium">
            Tutorials
          </div>
        </v-list-item-content>
      </v-list-item>

      <v-divider></v-divider>

      <v-treeview :items="routes" hoverable transition open-on-click>
        <template slot="label" slot-scope="props">
          <div v-if="props.item.name[0] === '#'">
            <router-link
              :to="{
                name: 'tutorial',
                params: { tenant: tenant.slug, id: props.item.file },
                hash: props.item.name
              }"
              class="links"
            >
              <div>
                {{
                  sentenceCasing(
                    props.item.name.substring(1).replace(/-/g, ' ')
                  )
                }}
              </div>
            </router-link>
          </div>

          <div v-else>
            <router-link
              :to="{
                name: 'tutorial',
                params: { tenant: tenant.slug, id: props.item.name }
              }"
              class="links"
            >
              <div>{{
                sentenceCasing(props.item.name.replace(/-/g, ' '))
              }}</div>
            </router-link>
          </div>
        </template>
      </v-treeview>
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
.cursor-point {
  cursor: pointer;
}

.sm-and-up-left-padding {
  // Match left padding with User Settings sidebar width
  padding-left: 356px;
  padding-right: 256px;
}

.sm-and-down-left-padding {
  // Match left padding with collapsed User Settings sidebar width
  padding-left: 136px;
  padding-right: 16px;
}

// stylelint-disable
.links {
  text-decoration: none;
  font-family: Roboto, sans-serif;
  color: #4d606e;
  word-wrap: break-word; /* IE 5.5-7 */
  white-space: -moz-pre-wrap; /* Firefox 1.0-2.0 */
  white-space: pre-wrap;
  font-size: 0.8125rem;
}
.router-link-active {
  color: #3b8dff;
  font-weight: bold;
  font-weight: 700;
}
// stylelint-enable
</style>
