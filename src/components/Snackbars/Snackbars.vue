<script>
/* eslint-disable vue/no-v-html */
import { mapGetters, mapActions } from 'vuex'
export default {
  computed: {
    ...mapGetters('alert', ['notifications']),
    list() {
      return this.notifications
    }
  },
  methods: {
    ...mapActions('alert', ['dismissNotification']),
    resolveColor(color) {
      if (!color) return
      if (color[0] === '#' || color.includes('var(')) return color
      return `var(--v-${color}-base)`
    }
  }
}
</script>

<template>
  <transition-group
    class="snackbars-wrapper justify-end d-flex flex-column align-end"
    name="snackbars-wrapper"
    tag="div"
  >
    <template v-for="item in list">
      <v-card
        :key="item.id"
        class="snackbars-snack rounded-sm elevation-4 mr-4 mb-4 py-2 pr-1"
        max-width="500px"
        :min-width="$vuetify.breakpoint.xsOnly ? '80%' : '350px'"
        :style="{ 'border-left': `6px solid ${resolveColor(item.color)}` }"
      >
        <v-card-actions class="pl-4 pr-1">
          <div class="utilGrayDark--text">
            <transition name="quick-fade" mode="out-in" tag="div">
              <div
                :key="item.supertext"
                class="text-caption mb-n1 font-weight-thin"
              >
                {{ item.supertext }}
              </div>
            </transition>

            <transition name="quick-fade" mode="out-in" tag="div">
              <div :key="item.text" class="text-body-1" v-html="item.text" />
            </transition>

            <transition name="quick-fade" mode="out-in" tag="div">
              <div
                :key="item.subtext"
                class="text-caption text--secondary mt-n1"
              >
                {{ item.subtext }}
              </div>
            </transition>
          </div>
          <v-spacer />

          <transition name="fade" mode="out-in" tag="div">
            <v-btn
              v-if="item.to"
              :color="item.color"
              class="ml-2"
              :to="item.to"
              small
              depressed
              @click="dismissNotification(item)"
            >
              {{ item.linkText || 'Details' }}
            </v-btn>
          </transition>

          <transition name="fade" mode="out-in" tag="div">
            <v-btn
              v-if="item.dismissable"
              color="grey lighten-1"
              class="ml-2"
              icon
              small
              @click="dismissNotification(item)"
            >
              <v-icon>close</v-icon>
            </v-btn>
          </transition>

          <v-progress-circular
            v-if="item.loading"
            :color="item.color"
            size="31"
            indeterminate
          />
        </v-card-actions>
      </v-card>
    </template>
  </transition-group>
</template>

<style lang="scss" scoped>
.snackbars-wrapper {
  height: 100vh;
  pointer-events: none;
  position: fixed;
  width: 100%;
  z-index: 1000;

  .snackbars-snack {
    pointer-events: auto;
    transition: all 0.5s;
  }

  &-enter,
  &-leave-to,
  &-leave-active {
    opacity: 0;
    transform: translateY(30px);
  }

  &-leave-active {
    position: absolute;
  }
}
</style>
