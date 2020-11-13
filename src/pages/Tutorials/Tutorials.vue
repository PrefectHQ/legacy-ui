<script>
import { mapGetters } from 'vuex'
import { parser, getRoutes } from '@/utils/markdownParser'
/* eslint-disable vue/no-v-html */

export default {
  data() {
    return {
      tutorials: [
        {
          icon: 'pi-flow-run',
          to: 'flow-run-tutorial',
          title: 'Running a Flow'
        },
        {
          icon: 'storage',
          to: 'universal-deploy-tutorial',
          title: 'Universal Deploy'
        }
      ],
      routes: getRoutes()
    }
  },

  computed: {
    ...mapGetters('tenant', ['tenant'])
  },
  methods: {
    mdParser(md) {
      return parser(md)
    }
  }
}
</script>

<template>
  <v-container>
    <v-navigation-drawer
      clipped
      left
      fixed
      permanent
      touchless
      :mini-variant="$vuetify.breakpoint.smAndDown"
      :style="{ top: $vuetify.breakpoint.smAndDown ? '56px' : '64px' }"
    >
      <template #prepend>
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
      </template>

      <v-divider />

      <v-treeview :items="routes" hoverable open-on-click transition>
        <template slot="label" slot-scope="props">
          <div v-if="props.item.name[0] === '#'">
            <router-link
              :to="{
                name: 'tutorial',
                params: { tenant: tenant.slug, id: props.item.file },
                hash: props.item.name
              }"
              class="links"
              >{{ props.item.name }}</router-link
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
              {{ props.item.name }}
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
  padding-left: 256px;
}

.sm-and-down-left-padding {
  // Match left padding with collapsed User Settings sidebar width
  padding-left: 56px;
}
// stylelint-disable

.links {
  color: #465968;
  font-size: 14px;
  text-decoration: none;
  font-family: Roboto, sans-serif;
}
.router-link-active {
  color: #3b8dff;
  font-weight: bold;
}

// stylelint-enable
</style>
