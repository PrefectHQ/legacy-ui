<script>
import { mapGetters, mapMutations } from 'vuex'
export default {
  computed: {
    ...mapGetters('alert', ['notifications']),
    list() {
      return this.notifications
    }
  },
  methods: {
    ...mapMutations('alert', ['dismiss'])
  }
}
</script>

<template>
  <transition-group
    class="alerts-drawer-wrapper justify-end d-flex flex-column align-end"
    name="alerts-drawer-wrapper"
    tag="div"
  >
    <template v-for="alert in list">
      <v-card
        :key="alert.id"
        class="alerts-snack rounded-sm elevation-4 mr-4 mb-4"
        max-width="500px"
        :min-width="$vuetify.breakpoint.xsOnly ? '80%' : '350px'"
        :color="alert.color"
      >
        <v-card-actions class="pl-4 pr-1">
          <span
            class="grey--text text--lighten-3 text-body-1"
            v-text="alert.text"
          />
          <v-spacer />
          <v-btn
            color="grey lighten-3"
            class="ml-2"
            icon
            @click="dismiss(alert)"
          >
            <v-icon>close</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </template>
  </transition-group>
</template>

<style lang="scss" scoped>
.alerts-drawer-wrapper {
  height: 100vh;
  pointer-events: none;
  position: fixed;
  width: 100%;
  z-index: 1000;

  .alerts-snack {
    pointer-events: auto;
    transition: all 0.5s;
  }

  &-enter,
  &-leave-to,
  &-leave-active {
    opacity: 0;
    transform: translateY(-30px);
  }

  &-leave-active {
    position: absolute;
  }
}
</style>
