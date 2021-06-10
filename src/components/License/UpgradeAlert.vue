<script>
import ExternalLink from '@/components/ExternalLink'
import { mapGetters } from 'vuex'

export default {
  components: {
    ExternalLink
  },
  computed: {
    ...mapGetters('license', ['license', 'hasPermission']),
    isSelfServe() {
      return this.license?.terms?.is_self_serve
    },
    isUsageBased() {
      return this.license?.terms?.is_usage_based
    },
    isTenantAdmin() {
      return this.hasPermission('create', 'license')
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
    icon="auto_awesome"
  >
    <v-row>
      <v-col v-if="!isUsageBased" cols="12">
        Pssst! We noticed you have a legacy license type. Prefect now has new
        licenses that include
        <span class="font-weight-bold">more users</span> and
        <span class="font-weight-bold">fewer limits.</span>
        <span v-if="!isSelfServe" class="pl-2"
          ><ExternalLink
            href="https://www.prefect.io/pricing#contact"
            target="_blank"
            >Contact us </ExternalLink
          >to find out more!</span
        >
      </v-col>
      <v-col v-else>
        <span v-if="!isSelfServe"
          >If you'd like to change your plan or get access to cool new features
          please
          <a href="https://www.prefect.io/pricing#contact" target="_blank">
            contact us!</a
          >
        </span>
        <span v-else>
          Upgrade your license to get access to cool new features!</span
        >
      </v-col>

      <v-col v-if="isSelfServe" cols="12" lg="4">
        <router-link
          :to="{ name: 'plan-comparison' }"
          style="text-decoration: none;"
        >
          <v-btn outlined color="codePink">
            Find Out More
          </v-btn>
        </router-link>
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
