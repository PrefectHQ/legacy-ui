<script>
import { teamProfileMixin } from '@/mixins/teamProfileMixin.js'
import { paymentMixin } from '@/mixins/paymentMixin.js'
import PaymentCard from '@/components/PaymentCard'
import { mapGetters } from 'vuex'

export default {
  components: { PaymentCard },
  mixins: [teamProfileMixin, paymentMixin],
  data() {
    return {
      editCardDetails: false,
      loading: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['user']),
    ...mapGetters('license', ['license']),
    exisitingCard() {
      if (!this.tenant?.stripe_customer?.sources?.data[0]?.card.last4) return ''
      return this.tenant?.stripe_customer?.sources?.data[0]?.card.last4
    },
    cardType() {
      return this.tenant?.stripe_customer?.sources?.data[0]?.card?.brand
    },
    exisitingCardExpiry() {
      if (!this.tenant?.stripe_customer?.sources?.data[0]?.card?.exp_month)
        return ''
      return `${this.tenant?.stripe_customer?.sources?.data[0].card.exp_month}/${this.tenant?.stripe_customer?.sources?.data[0].card.exp_year}`
    },
    zip() {
      return this.tenant?.stripe_customer?.sources?.data[0]?.owner?.address
        ?.postal_code
    },
    paymentDetails() {
      return this.tenant?.stripe_customer?.sources?.data[0]
    },
    updateOrAdd() {
      if (this.paymentDetails) return 'Update'
      return 'Add'
    },
    isSelfServe() {
      return this.license?.terms?.plan == 'SELF_SERVE'
    },
    planType() {
      if (this.license?.terms?.plan == 'SELF_SERVE') return 'Cloud Developer'
      if (this.license?.terms?.plan == 'PLATFORM') return 'Cloud Enterprise'
      return 'Custom'
    }
  },
  watch: {
    license(val) {
      this.loading = true
      if (!val) {
        setTimeout(() => {
          this.loading = false
        }, 1000)
      }
    }
  },
  methods: {}
}
</script>

<template>
  <v-card
    data-cy="billing-card"
    tile
    max-width="720"
    class="mx-auto my-4"
    :loading="loading"
  >
    <v-card-title> Billing </v-card-title>
    <v-card-subtitle> See and edit your billing information.</v-card-subtitle>
    <v-card-text>
      <v-alert
        v-if="!isSelfServe && !loading"
        class="mx-auto mb-12"
        border="left"
        colored-border
        elevation="2"
        type="info"
        tile
        icon="lock"
        max-width="540"
      >
        You are on a {{ planType }} license. To update your payment details,
        please
        <a href="https://www.prefect.io/get-prefect#contact" target="_blank">
          contact our sales team
        </a>
      </v-alert>
      <v-alert
        v-else-if="!paymentDetails"
        class="mx-auto mb-12"
        border="left"
        colored-border
        elevation="2"
        type="warning"
        tile
        icon="lock"
        max-width="540"
      >
        We could not find any payment details associated with this account.
      </v-alert>
      <v-alert
        v-else-if="!isTenantAdmin"
        class="mx-auto mb-12"
        border="left"
        colored-border
        elevation="2"
        type="warning"
        tile
        icon="lock"
        max-width="540"
      >
        Only your team's administrators can modify billing settings.
      </v-alert>

      <v-row v-if="paymentDetails && isSelfServe">
        <v-col cols="12" md="6" class="px-8">
          <div class="text-h6 mb-4 grey--text text--darken-3">
            Address
          </div>

          <div class="d-flex justify-start align-start">
            <div class="mr-2">
              <v-icon color="primary">fas fa-home</v-icon>
            </div>
            <div>
              <div class="my-1 text-body-1 font-weight-medium">
                {{ username }}
              </div>
              <div class="my-1 text-body-1">{{ address }}</div>
              <div class="my-1 text-body-1">{{ zip }}</div>
            </div>
          </div>
        </v-col>

        <v-col cols="12" md="6" class="px-8">
          <div class="text-h6 mb-4 grey--text text--darken-3">
            Payment Method
          </div>

          <div class="d-flex justify-start align-start">
            <div class="mr-2">
              <v-icon color="primary">
                {{ `fa fa-cc-${cardType.toLowerCase()}` }}
              </v-icon>
            </div>
            <div>
              <div class="my-1 text-body-1 font-weight-medium">
                {{ cardType }} -
                {{ exisitingCard }}
              </div>
              <div class="my-1 text-body-1">
                Exp. {{ exisitingCardExpiry }}
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
      <PaymentCard
        v-if="editCardDetails"
        :update-card="true"
        :update-users="false"
        @close="editCardDetails = false"
      />
    </v-card-text>

    <v-card-actions v-if="isTenantAdmin">
      <v-spacer></v-spacer>
      <v-btn
        v-if="!editCardDetails && isSelfServe"
        data-cy="add-payment-card"
        color="primary"
        @click="editCardDetails = true"
      >
        {{ updateOrAdd }} Payment
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
