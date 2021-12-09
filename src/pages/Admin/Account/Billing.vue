<script>
import CardDetails from '@/components/Plans/CardDetails'
import { mapActions, mapGetters } from 'vuex'
import { pollsTenantsMixin } from '@/mixins/polling/pollsTenantsMixin'

export default {
  components: { CardDetails },
  mixins: [pollsTenantsMixin],
  props: {
    page: {
      type: String,
      required: false,
      default: ''
    }
  },
  data() {
    return {
      editCardDetails: false,
      loading: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'tenants']),
    ...mapGetters('user', ['user']),
    ...mapGetters('license', ['license', 'hasPermission']),
    isBank() {
      return (
        this.payment?.type == 'ach_credit_transfer' ||
        this.payment?.type == 'ach_debit'
      )
    },
    isCard() {
      return this.payment?.type == 'card'
    },
    updateOrAdd() {
      if (this.payment) return 'Update'
      return 'Add'
    },
    isSelfServe() {
      return this.license?.terms?.is_self_serve
    },
    permissionsCheck() {
      return this.hasPermission('update', 'license')
    },
    payment() {
      return this.tenant?.stripe_customer?.sources?.data?.find(
        d =>
          d.status == 'chargeable' &&
          d.id == this.tenant?.stripe_customer?.default_source
      )
    }
  },
  methods: {
    ...mapActions('tenant', ['getTenants']),
    async confirmCard() {
      this.loading = true
      await this.getTenants()
      this.loading = false
      this.editCardDetails = false
    }
  }
}
</script>

<template>
  <v-card
    data-cy="billing-card"
    :class="{
      'warning-border': !payment,
      'success-border': payment,
      'prefect-border': editCardDetails
    }"
    tile
    :loading="loading"
  >
    <v-card-title class="text-h4 font-weight-light">
      <div>
        Payment
      </div>
      <v-spacer />
      <v-btn
        v-if="!editCardDetails && isSelfServe && permissionsCheck"
        data-cy="add-payment-card"
        color="primary"
        depressed
        small
        @click="editCardDetails = true"
      >
        {{ updateOrAdd }} payment
      </v-btn>
    </v-card-title>

    <v-card-text style="min-height: 100px;">
      <transition name="fade-expand" mode="out-in">
        <div v-if="!isSelfServe && !loading" class="text-subtitle-1">
          To update your payment details, please
          <a href="https://www.prefect.io/pricing#contact" target="_blank">
            contact our sales team
          </a>
        </div>

        <div
          v-else-if="!payment && !editCardDetails"
          class="text-subtitle-1 utilGrayMid--text"
        >
          You haven't added a payment method
        </div>

        <div v-else-if="editCardDetails" key="card-details">
          <div style="height: 500px;">
            <CardDetails @confirm="confirmCard" />
          </div>

          <v-btn
            v-if="editCardDetails"
            class="text-none mt-4"
            depressed
            block
            text
            @click="editCardDetails = false"
          >
            Cancel
          </v-btn>
        </div>

        <div v-else-if="isCard" key="card-display">
          <div class="mb-auto d-flex align-center justify--start">
            <div>
              <div v-if="payment.owner" class="text-h5 font-weight-light">
                {{ payment.owner.name }}
              </div>
              <div v-if="payment.card" class="mt-1">
                <div class="text-subtitle-1">
                  {{ payment.brand || payment.card.brand }}
                </div>

                <div class="mt-n2">
                  <span class="text-h6 font-weight-regular utilGrayMid--text">
                    •••• •••• •••• {{ payment.last4 || payment.card.last4 }}
                  </span>
                  <span
                    v-if="payment.exp_month || payment.card"
                    class="ml-1 text-subtitle-1 font-weight-light"
                  >
                    {{ payment.exp_month || payment.card.exp_month }}/{{
                      payment.exp_year || payment.card.exp_year
                    }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="payment.card" class="ml-auto">
              <v-icon large>
                fab fa-cc-{{ payment.card.brand.toLowerCase() }}
              </v-icon>
            </div>
          </div>
        </div>

        <div v-else-if="isBank" key="bank-display">
          <div class="mb-auto d-flex align-center justify--start">
            <div>
              <div v-if="payment.owner" class="text-h5 font-weight-light">
                {{ payment.owner.name }}
              </div>
              <div v-if="payment.ach_credit_transfer" class="mt-1">
                <div class="text-subtitle-1">
                  {{ payment.ach_credit_transfer.bank_name }}
                </div>

                <div class="mt-n2">
                  <div class="text-h6 font-weight-regular">
                    ••••••••••••
                    {{
                      payment.ach_credit_transfer.account_number &&
                        payment.ach_credit_transfer.account_number.substring(
                          payment.ach_credit_transfer.account_number.length - 4
                        )
                    }}
                  </div>
                  <div class="text-subtitle-1 font-weight-light">
                    ••••••••••••
                    {{
                      payment.ach_credit_transfer.routing_number &&
                        payment.ach_credit_transfer.routing_number.substring(
                          payment.ach_credit_transfer.routing_number.length - 4
                        )
                    }}
                  </div>
                </div>
              </div>

              <div v-else-if="payment.ach_debit" class="mt-1">
                <div class="text-subtitle-1">
                  {{ payment.ach_debit.bank_name }}
                </div>

                <div class="mt-n2">
                  <div
                    v-if="payment.ach_debit.account_number"
                    class="text-h6 font-weight-regular"
                  >
                    ••••••••••••
                    {{
                      payment.ach_debit.account_number.substring(
                        payment.ach_debit.account_number.length - 4
                      )
                    }}
                  </div>
                  <div
                    v-if="payment.ach_debit.routing_number"
                    class="text-subtitle-1 font-weight-light"
                  >
                    ••••••••••••
                    {{
                      payment.ach_debit.routing_number.substring(
                        payment.ach_debit.routing_number.length - 4
                      )
                    }}
                  </div>
                </div>
              </div>
            </div>

            <div class="ml-auto">
              <v-icon large>
                fad fa-university
              </v-icon>
            </div>
          </div>
        </div>

        <div v-else class="text-subtitle-1">
          Sorry, we're having trouble displaying your payment method. For
          questions, please contact us via email at
          <span class="primary--text">support@prefect.io</span> or on our
          <router-link :to="'/help'">support page</router-link>
        </div>
      </transition>
    </v-card-text>

    <!-- <v-card-actions v-if="permissionsCheck" class="mt-auto px-4"> </v-card-actions> -->
  </v-card>
</template>

<style lang="scss" scoped>
.warning-border {
  border-left: 6px solid var(--v-warning-base);
  transition: border-left 100ms;
}

.success-border {
  border-left: 6px solid var(--v-Success-base);
  transition: border-left 100ms;
}

.prefect-border {
  border-left: 6px solid var(--v-prefect-base);
  transition: border-left 100ms;
}
</style>
