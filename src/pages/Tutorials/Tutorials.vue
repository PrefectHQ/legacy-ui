<script>
import { mapGetters } from 'vuex'
import { parser, getRoutes } from '@/utils/markdownParser'
/* eslint-disable vue/no-v-html */

export default {
  data() {
    return {
      routes: getRoutes(),
      icon: true
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant'])
  },
  methods: {
    mdParser(md) {
      return parser(md)
    },
    toggle() {
      this.icon = !this.icon
    }
  }
}
</script>

<template>
  <v-container>
    <v-icon class="blue--text accent-4 float-right" large @click.stop="toggle">
      {{ !icon ? 'keyboard_arrow_left' : 'keyboard_arrow_right' }}
    </v-icon>

    <v-navigation-drawer v-model="icon" app clipped right fixed touchless>
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

      <v-treeview :items="routes" hoverable transition open-all>
        <template slot="label" slot-scope="props">
          <div v-if="props.item.name[0] === '#'">
            <router-link
              :to="{
                name: 'tutorial',
                params: { tenant: tenant.slug, id: props.item.file },
                hash: props.item.name
              }"
              class="links"
              >{{
                props.item.name
                  .substring(1)
                  .replace(/-/g, ' ')
                  .toUpperCase()
              }}</router-link
            >
          </div>

          <div v-else>
            <router-link
              :to="{
                name: 'tutorial',
                params: { tenant: tenant.slug, id: props.item.name }
              }"
              class="links"
            >
              {{ props.item.name.replace(/-/g, ' ').toUpperCase() }}
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
  padding-left: 56px;
}

.sm-and-down-left-padding {
  // Match left padding with collapsed User Settings sidebar width
  padding-left: 36px;
}
// stylelint-disable

.links {
  text-decoration: none;
  font-family: Roboto, sans-serif;
  color: #4d606e;
  word-wrap: break-word; /* IE 5.5-7 */
  white-space: -moz-pre-wrap; /* Firefox 1.0-2.0 */
  white-space: pre-wrap;
}
.router-link-active {
  color: #3b8dff;
  font-weight: bold;
  font-weight: 700;
}
// stylelint-enable
</style>
