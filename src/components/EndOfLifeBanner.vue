<script>
import { mapGetters } from 'vuex'
import ExternalLink from '@/components/ExternalLink'

export default {
  components: { ExternalLink },
  computed: {
    ...mapGetters('api', ['isCloud']),
    ...mapGetters('license', ['planType']),
    free() {
      return this.planType('FREE')
    },
    frozen() {
      return this.license?.terms?.frozen
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
        <div v-if="frozen" class="ml-4">
          This legacy Prefect Cloud account has been frozen.
          <ExternalLink
            href="https://www.prefect.io/guide/blog/freezing-legacy-prefect-cloud-1-accounts-on-starter-and-standard-plans/"
            >Click here</ExternalLink
          >
          for more information.
        </div>
        <div v-else-if="free" class="ml-4">
          This legacy Prefect Cloud account will be frozen on May 15th, 2023.
          <ExternalLink
            href="https://www.prefect.io/guide/blog/freezing-legacy-prefect-cloud-1-accounts-on-starter-and-standard-plans/"
            >Click here</ExternalLink
          >
          to learn more or to start your migration to
          <ExternalLink
            href="https://www.prefect.io/guide/blog/introducing-prefect-cloud-2-0/"
            >Prefect Cloud 2</ExternalLink
          >.
        </div>
        <div v-else class="ml-4">
          This legacy Prefect Cloud account will be frozen on July 15th, 2023.
          <ExternalLink
            href="https://www.prefect.io/guide/blog/freezing-legacy-prefect-cloud-1-accounts-on-starter-and-standard-plans/"
            >Click here</ExternalLink
          >
          to learn more or start your migration to
          <ExternalLink
            href="https://www.prefect.io/guide/blog/introducing-prefect-cloud-2-0/"
            >Prefect Cloud 2</ExternalLink
          >.
        </div>
      </div>
    </template>
  </v-banner>
</template>
