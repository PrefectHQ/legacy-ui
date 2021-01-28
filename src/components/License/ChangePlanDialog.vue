<script>
import { mapGetters } from 'vuex'
import Billing from '@/pages/TeamSettings/Account/Billing'

export default {
  components: {
    Billing
  },
  props: {
    plan: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: false
    }
  },
  computed: {
    ...mapGetters('license', ['license']),
    ...mapGetters('tenant', ['tenant']),
    existingCard() {
      return !this.tenant?.stripe_customer?.sources?.data[0]?.card
    },
    isTenantAdmin() {
      return this.tenant.role === 'TENANT_ADMIN'
    },
    isSelfServe() {
      return (
        this.license?.terms?.plan === 'SELF_SERVE' ||
        this.license?.terms?.is_self_serve
      )
    },
    planCost() {
      console.log(this.plan)
      return this.plan?.cost
    }
  }
}
</script>

<template>
  <v-dialog
    v-model="changePlanDialog"
    max-width="600"
    min-height="500px"
    @click:outside="reset"
  >
    <template #activator="{ on: dialog }">
      <v-btn color="primary" v-on="{ ...dialog }">
        Change Plan
      </v-btn>
    </template>

    <v-card flat :loading="markAsLoading">
      <v-card-title>
        Change Plan
      </v-card-title>
      <v-card-text>
        <v-alert
          v-if="!isSelfServe & !loading"
          class="mx-auto mb-12"
          border="left"
          colored-border
          elevation="2"
          type="info"
          tile
          icon="lock"
          max-width="540"
        >
          To change your license terms, please
          <a href="https://www.prefect.io/get-prefect#contact" target="_blank"
            >contact our sales team</a
          >
        </v-alert>
        <v-alert
          v-else-if="!isTenantAdmin & !loading"
          class="mx-auto mb-12"
          border="left"
          colored-border
          elevation="2"
          type="warning"
          tile
          icon="lock"
          max-width="540"
          >Only your team's administrators can modify these settings.
        </v-alert>
        <div v-else-if="existingCard && planCost">
          Your card ending in
          <span class="font-weight-bold"> {{ existingCard.last4 }}</span>

          will now be charged
          <span class="font-weight-bold mx-1">${{ planCost }} </span> on a
          monthly basis
        </div>
        <div v-if="planCost && !existingCard"> <Billing /></div>
      </v-card-text>
      <v-card-actions>
        <v-btn color="primary">
          Confirm
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style>
.theme--light.v-subheader {
  color: #000;
  font-weight: bold !important;
}

.checkbox-container {
  margin-left: 30px;
  margin-top: -20px;
}
/* stylelint-disable */
.set-state .v-btn__loader {
  color: #fff;
}

.card-title {
  margin-left: -12px;
  margin-top: -10px;
  margin-bottom: 10px;
}
</style>
