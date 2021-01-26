<script>
import ExternalLink from '@/components/ExternalLink'

export default {
  components: {
    ExternalLink
  },
  props: {
    license: {
      type: Object,
      required: true
    }
  }
}
</script>

<template>
  <v-alert
    width="100%"
    class="mx-auto "
    border="left"
    colored-border
    elevation="2"
    type="info"
    tile
    color="codePink"
  >
    <div class="subtitle-1 grey--text text--darken-2">
      Pssst.... We noticed you have an old license type. </div
    ><div class="subtitle-1 grey--text text--darken-2">
      Prefect now has
      <ExternalLink href="https://www.prefect.io/get-prefect#pricing">
        new licenses
      </ExternalLink>
      that include
      <span class="font-weight-bold">more users</span> and
      <span class="font-weight-bold">less limits.</span></div
    >
    <div
      v-if="!license.terms.is_self_serve"
      class="subtitle-1 grey--text text--darken-2"
      ><ExternalLink
        href="https://www.prefect.io/get-prefect#contact"
        target="_blank"
        >Contact us </ExternalLink
      >to find out more!</div
    >

    <div v-else class="text-right">
      <v-btn dark color="codePink">
        Find Out More
      </v-btn>
    </div>
  </v-alert>
</template>
