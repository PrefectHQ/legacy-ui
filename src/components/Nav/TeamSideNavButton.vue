<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  data() {
    return {}
  },
  computed: {
    ...mapGetters('sideNav', ['isOpen']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['invitations']),
    size() {
      return this.$vuetify.breakpoint.mdAndUp ? (this.isOpen ? 325 : 225) : 175
    }
  },
  methods: {
    ...mapMutations('sideNav', ['toggle'])
  }
}
</script>

<template>
  <v-btn
    class="text-subtitle-1 text-capitalize mx-1 font-weight-medium d-flex justify-space-between px-3"
    dark
    large
    depressed
    :width="size"
    style="
      background-color: rgba(255, 255, 255, 0.1);
      transition: width 200ms;"
    title="Open the sidebar"
    @click.stop="toggle"
  >
    <div
      style="font-size: 1.05rem;"
      class="d-flex align-center justify-start"
      :style="{ width: size - 45 + 'px' }"
    >
      <div class="text-truncate">
        {{ tenant.name }}
      </div>
      <v-badge
        inline
        :value="invitations && invitations.length"
        :content="invitations && invitations.length"
        color="accentPink"
      />
    </div>
    <v-icon class="flex-shrink-0">
      {{ isOpen ? 'chevron_left' : 'chevron_right' }}
    </v-icon>
  </v-btn>
</template>
