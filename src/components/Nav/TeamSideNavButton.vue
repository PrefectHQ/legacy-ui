<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  data() {
    return {}
  },
  computed: {
    ...mapGetters('sideNav', ['isOpen']),
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['invitations'])
  },
  methods: {
    ...mapMutations('sideNav', ['toggle'])
  }
}
</script>

<template>
  <v-btn
    class="text-subtitle-1 text-capitalize mx-1 font-weight-medium d-flex justify-space-between"
    dark
    large
    depressed
    :width="isOpen ? 300 : 200"
    style="
      background-color: rgba(255, 255, 255, 0.1);
      transition: width 200ms;"
    title="Open the team sidebar"
    @click.stop="toggle"
  >
    <div style="font-size: 1.05rem;" class="d-flex align-center justify-start">
      <div>{{ tenant.name }}</div>
      <v-badge
        inline
        :value="invitations.length"
        :content="invitations.length"
        color="accentPink"
      />
    </div>
    <v-icon>
      {{ isOpen ? 'chevron_left' : 'chevron_right' }}
    </v-icon>
  </v-btn>
</template>
