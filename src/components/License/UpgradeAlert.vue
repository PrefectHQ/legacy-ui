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
    class="mx-auto mt-4 alert"
    border="left"
    colored-border
    elevation="2"
    type="info"
    tile
    color="codePink"
    icon="upgrade"
  >
    <v-row>
      <v-col v-if="!license.is_usage_based" cols="12" lg="8">
        Pssst.... We noticed you have a legacy license type. Prefect now has new
        licenses that include
        <span class="font-weight-bold">more users</span> and
        <span class="font-weight-bold">less limits.</span>
        <div
          v-if="!license.terms.is_self_serve"
          class="subtitle-1 grey--text text--darken-2"
          ><ExternalLink
            href="https://www.prefect.io/get-prefect#contact"
            target="_blank"
            >Contact us </ExternalLink
          >to find out more!</div
        >
      </v-col>
      <v-col v-else>
        <span v-if="!isSelfServe">
          <a href="https://www.prefect.io/get-prefect#contact" target="_blank">
            Contact us</a
          >
          to change your plan or</span
        ><span v-else> Check out our license plans</span>
        to get access to cool new features!
      </v-col>

      <v-col v-if="license.terms.is_self_serve" cols="12" lg="4">
        <v-btn outlined color="codePink">
          Find Out More
        </v-btn>
      </v-col>
    </v-row>
  </v-alert>
</template>

<style>
/* stylelint-disable */
.alert .v-alert__icon.v-icon {
  padding-top: 24px;
}
</style>
