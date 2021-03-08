<script>
import { paymentMixin } from '@/mixins/paymentMixin.js'
import CardDetails from '@/components/Plans/CardDetails'
import { mapGetters } from 'vuex'

export default {
  components: { CardDetails },
  mixins: [paymentMixin],
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
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['user']),
    ...mapGetters('license', ['license']),
    card() {
      return this.tenant?.stripe_customer?.sources?.data[0]
    },
    updateOrAdd() {
      if (this.card) return 'Update'
      return 'Add'
    },
    isSelfServe() {
      return this.license?.terms?.is_self_serve
    },
    isTenantAdmin() {
      return this.tenant.role === 'TENANT_ADMIN'
    }
  },
  methods: {}
}
</script>

<template>
  <v-card data-cy="billing-card" tile :loading="loading">
    <v-card-title class="mb-2 text-h4 font-weight-light">
      <div>
        Payment
      </div>

      <v-spacer />

      <v-btn
        v-if="!editCardDetails && isSelfServe && isTenantAdmin"
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
        <v-alert
          v-if="!isSelfServe && !loading"
          key="alert-2"
          class="mx-auto mb-12"
          border="left"
          colored-border
          elevation="2"
          type="info"
          tile
          icon="lock"
          max-width="540"
        >
          To update your payment details, please
          <a href="https://www.prefect.io/get-prefect#contact" target="_blank">
            contact our sales team
          </a>
        </v-alert>
        <v-alert
          v-else-if="!card"
          key="alert-3"
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

        <div v-else-if="editCardDetails" key="card-details">
          <div style="height: 500px;">
            <CardDetails @confirm="editCardDetails = false" />
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

        <div v-else key="card-display">
          <div class="mb-auto d-flex align-center justify--start">
            <div>
              <div
                v-if="
                  (card && card.owner && card.owner.name) || (card && card.name)
                "
                class="text-h5 font-weight-light"
              >
                {{ card.owner.name }}
              </div>
              <div v-if="card" class="mt-1">
                <div class="text-subtitle-1">
                  {{ card.brand || card.card.brand }}
                </div>

                <div class="mt-n2">
                  <span class="text-h6 font-weight-regular">
                    •••• •••• •••• {{ card.last4 || card.card.last4 }}
                  </span>
                  <span class="ml-1 text-subtitle-1 font-weight-light">
                    {{ card.exp_month || card.card.exp_month }}/{{
                      card.exp_year || card.card.exp_year
                    }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="card.card" class="ml-auto">
              <v-icon large>
                fab fa-cc-{{ card.card.brand.toLowerCase() }}
              </v-icon>
            </div>
          </div>
        </div>
      </transition>
    </v-card-text>

    <!-- <v-card-actions v-if="isTenantAdmin" class="mt-auto px-4"> </v-card-actions> -->
  </v-card>
</template>
