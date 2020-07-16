<script>
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
      ]
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
      <template v-slot:prepend>
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

      <v-list dense>
        <v-list-item
          v-for="(tutorial, index) in tutorials"
          :key="index"
          :to="{ name: tutorial.to }"
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
