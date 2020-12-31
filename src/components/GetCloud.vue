<template>
  <a
    title="Get Cloud!"
    href="https://www.prefect.io/get-prefect#pricing"
    target="_blank"
  >
    <v-icon v-if="!isCloud" dense class="mr-2">
      cloud
    </v-icon>
    Get Cloud
  </a>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  computed: {
    ...mapGetters('api', ['isCloud'])
  }
}
</script>
