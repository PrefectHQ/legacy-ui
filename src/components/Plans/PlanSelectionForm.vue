<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import CardDetails from '@/components/Plans/CardDetails'

import { PLANS_2021 } from '@/utils/plans'

export default {
  components: {
    CardDetails
  },
  props: {
    planReference: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      newCard: false
    }
  },
  computed: {
    ...mapGetters('license', ['license']),
    ...mapGetters('tenant', ['tenant']),
    existingCard() {
      console.log(this.tenant.stripe_customer)
      return this.tenant?.stripe_customer?.sources?.data[0]?.card
    },
    cards() {
      return this.tenant?.stripe_customer?.source?.data
    },
    isSelfServe() {
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
    plan() {
      return PLANS_2021[this.planReference]
    },
    additionalCost() {
      return this.plan?.additionalCost
    },
    limit() {
      return this.plan.taskRuns
    },
    disableChangePlan() {
      const type = this.tempPlanName || this.license?.terms?.plan
      const planName = type === 'STARTER_2021' ? 'FREE_2021' : type
      return (
        !this.isTenantAdmin || !this.isSelfServe || this.plan.value === planName
      )
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapActions('license', ['getLicense']),
    ...mapMutations('license', ['setTempLicenseType']),
    async changePlan() {
      const planvalue =
        this.plan.value === 'FREE_2021' && this.existingCard
          ? 'STARTER_2021'
          : this.plan.value
      this.loading = true
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/License/create-usage-based-license.gql'),
          variables: {
            input: {
              tenant_id: this.tenant.id,
              plan_name: planvalue
            }
          }
        })
        if (data.create_usage_license.id) {
          this.alertMessage = {
            alertShow: true,
            alertMessage: `You are now on the Prefect ${this.planName} plan`,
            alertType: 'success'
          }
          this.setTempLicenseType(planvalue)
          this.$emit('update', this.plan.value)
          this.tempPlanName = planvalue
        }
      } catch (e) {
        this.alertMessage = {
          alertShow: true,
          alertMessage:
            'There was a problem updating your license.  Please try again or contact help@prefect.io',
          alertType: 'error'
        }
      } finally {
        this.setAlert(this.alertMessage)
        this.loading = false
        this.changePlanDialog = false
      }
    },
    selectCard(id) {
      if (id == 'new') {
        this.newCard = true
      } else {
        this.updateCustomer(id)
      }
    },
    async updateCustomer(sourceId) {
      try {
        const customer = await this.$apollo.mutate({
          mutation: require('@/graphql/License/update-customer.gql'),
          variables: {
            email: this.email,
            name: this.username,
            source: sourceId
          },
          errorPolicy: 'all'
        })

        console.log(customer)
      } catch (e) {
        console.log(e)
      }
    }
  }
}
</script>

<template>
  <div
    class="form-container text-center blue-grey--text text--darken-2 white rounded elevation-8 pa-8"
  >
    <div class="text-h4 font-weight-light">
      Confirm your payment details
    </div>

    <div v-if="newCard">
      <CardDetails />
    </div>

    <div v-else>
      <div @click="selectCard('new')">Enter new card</div>
      <div v-for="card in cards" :key="card.id" @click="selectCard(card.id)">
        {{ card }}
      </div>
      <!-- <div v-if="existingCard && planCost">
        <i class="fas fa-credit-card" />
        Your card ending in
        <span class="font-weight-bold"> {{ existingCard.last4 }}</span>

        will be charged
        <span class="font-weight-bold ">${{ planCost }} </span> per successful
        task run on a recurring monthly basis.
      </div>
      <div v-else>
        <CardDetails :update-card="true" :update-users="false" />
      </div> -->
    </div>
  </div>
  <!-- <v-card :loading="loading">
    <v-card-title class="grey--text text--darken-2">
      Change to the
      <span class="primary--text px-1"> Prefect {{ planName }}</span> Plan
    </v-card-title>
    <v-card-text>
      <v-alert
        v-if="!isTenantAdmin & !loading"
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
      <v-alert
        v-else-if="!isSelfServe & !loading"
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
      <div v-else-if="existingCard && planCost">
        <i class="fas fa-credit-card" />
        Your card ending in
        <span class="font-weight-bold"> {{ existingCard.last4 }}</span>

        will be charged
        <span class="font-weight-bold ">${{ planCost }} </span> on a monthly
        basis.
      </div>
      <div v-else-if="planCost && !existingCard"> <Billing page="plan"/></div>
      <div v-if="!planCost && isSelfServe">
        This plan is free. If you want to run more than {{ limit }} task
        runs/month you will need to add a credit card in the Team Account page.
      </div>
    </v-card-text>
    <v-card-actions class="py-4">
      <v-spacer />
      <v-btn
        v-if="isSelfServe && isTenantAdmin"
        text
        @click="changePlanDialog = false"
      >
        Cancel
      </v-btn>
      <v-btn
        v-if="isSelfServe && isTenantAdmin"
        :loading="loading"
        color="primary"
        @click="changePlan"
      >
        Confirm
      </v-btn>
    </v-card-actions>
  </v-card> -->
</template>

<style lang="scss" scoped>
.form-container {
  height: min-content;
  min-height: 800px;
  overflow: hidden;
  transition: all 150ms;
  width: 600px;
}

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
