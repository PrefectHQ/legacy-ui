<script>
import { mapGetters } from 'vuex'
import { getRoutes } from '@/utils/markdownParser'

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
    ...mapGetters('tenant', ['tenant']),
    tutorialParser() {
      // this.tenant.prefectAdminSettings -> emtpy right now
      return false
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

      <v-expansion-panels v-if="tutorialParser" focusable>
        <v-expansion-panel v-for="(item, i) in routes" :key="i">
          <v-expansion-panel-header>
            <router-link :to="item.fileName">{{ item.fileName }}</router-link>
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-list-item v-for="(id, index) in item.ids" :key="index">
              <v-list-item-content>
                <v-list-item-title>
                  <!-- <router-link :to="item.fileName + id"> {{ id }}</router-link> -->
                  <a :href="id">{{ id.replace(/#/gm, '') }}</a>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
      <v-list v-else dense>
        <v-list-item
          v-for="(tutorial, index) in tutorials"
          :key="index"
          :to="{ name: tutorial.to, params: { tenant: tenant.slug } }"
          ripple
          exact
        >
          <v-list-item-action>
            <v-icon v-if="tutorial.icon">{{ tutorial.icon }}</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>{{ tutorial.title }}</v-list-item-title>
            <v-list-item-subtitle v-if="tutorial.subtitle">{{
              tutorial.subtitle
            }}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <div
      :class="{
        'sm-and-down-left-padding': $vuetify.breakpoint.smAndDown,
        'sm-and-up-left-padding': $vuetify.breakpoint.smAndUp
      }"
      style="min-height: 100%;"
    >
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
</style>
