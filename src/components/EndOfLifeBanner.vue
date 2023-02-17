<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('license', ['planType']),
    free() {
      return this.planType('FREE')
    }
  }
}
</script>

<template>
  <v-banner>
    <template #default>
      <div class="d-flex align-center">
        <v-avatar slot="icon" rounded color="primary" size="40">
          <v-icon color="white"> warning </v-icon>
        </v-avatar>
        <div v-if="free" class="ml-4">
          This legacy Prefect Cloud account will be frozen on May 1st, 2023.
          Click here to learn more or start your migration to Prefect Cloud 2.
        </div>
        <div v-else class="ml-4">
          This legacy Prefect Cloud account will be frozen on July 15th, 2023.
          Click here to learn more or start your migration to Prefect Cloud 2.
        </div>
      </div>
    </template>
  </v-banner>
</template>
