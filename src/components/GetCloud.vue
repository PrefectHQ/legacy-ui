<template>
  <v-icon v-if="!isCloud" dense color="primary lighten-1" title="Get Cloud!"
    >cloud</v-icon
  >
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  computed: {
    ...mapGetters('api', ['isCloud'])
  }
}
</script>
