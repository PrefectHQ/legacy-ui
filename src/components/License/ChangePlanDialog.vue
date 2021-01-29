<script>
import { mapGetters, mapActions } from 'vuex'
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
      loading: false,
      changePlanDialog: false
    }
  },
  computed: {
    ...mapGetters('license', ['license']),
    ...mapGetters('tenant', ['tenant']),
    existingCard() {
      return this.tenant?.stripe_customer?.sources?.data[0]?.card
    },
    isTenantAdmin() {
      return this.tenant.role === 'TENANT_ADMIN'
    },
    isSelfServe() {
      console.log(this.plan)
      return (
        this.license?.terms?.plan === 'SELF_SERVE' ||
        this.license?.terms?.is_self_serve
      )
    },
    planName() {
      return this.plan?.name
    },
    planCost() {
      return this.plan?.price
    },
    additionalCost() {
      return this.plan?.additionalCost
    },
    limit() {
      return this.plan.taskRuns
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    async changePlan() {
      const planvalue =
        this.plan.value === 'FREE_2021' && this.existingCard
          ? 'STARTER_2021'
          : this.plan.value
      console.log(planvalue)
      this.loading = true
      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/License/create-usage-based-license.gql'),
          variables: {
            input: {
              tenant_id: this.tenant.id,
              plan_name: planvalue
            }
          }
        })
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage:
            'There was an error changing your plan.  Please try again or contact help@prefect.io',
          alertType: 'error'
        })
      } finally {
        this.loading = false
        this.changePlanDialog = false
      }
    }
  }
}
</script>

<template>
  <v-dialog v-model="changePlanDialog" max-width="600" min-height="500px">
    <template #activator="{ on: dialog }">
      <v-btn color="primary" v-on="{ ...dialog }">
        Change Plan
      </v-btn>
    </template>

    <v-card :loading="loading">
      <v-card-title class="grey--text text--darken-2">
        Change to the
        <span class="primary--text px-2"> Prefect {{ planName }}</span> Plan
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
          <v-icon small class="pr-4">star_rate</v-icon>Your card ending in
          <span class="font-weight-bold"> {{ existingCard.last4 }}</span>

          will be charged
          <span class="font-weight-bold mx-1">${{ planCost }} </span> on a
          monthly basis
        </div>
        <div v-if="planCost && !existingCard"> <Billing page="plan"/></div>
        <div v-if="!planCost && isSelfServe">
          <v-icon small class="pr-4">star_rate</v-icon>Your plan is free! You
          will pay {{ additionalCost }} for succesful task runs after
          {{ limit }}/month</div
        >
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn :loading="loading" color="primary" @click="changePlan">
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
