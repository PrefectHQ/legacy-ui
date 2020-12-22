<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  computed: {
    ...mapGetters('sideNav', ['isOpen']),
    ...mapGetters('tenant', ['tenant']),
    model: {
      get() {
        return this.isOpen
      },
      set(value) {
        if (value === false) {
          this.close()
        }
      }
    }
  },
  methods: {
    ...mapMutations('sideNav', ['close'])
  }
}
</script>

<template>
  <v-navigation-drawer
    v-model="model"
    temporary
    hide-overlay
    absolute
    elevation="0"
    width="375"
    class="drawer"
  >
    some content
  </v-navigation-drawer>
</template>

<style lang="scss" scoped>
.drawer {
  height: calc(100vh - 64px);
  padding-top: 64px;
}

.logo {
  height: 38px;
  width: 24px;
}
</style>
