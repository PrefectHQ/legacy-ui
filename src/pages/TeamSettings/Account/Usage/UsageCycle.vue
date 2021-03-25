<script>
import { formatTime } from '@/mixins/formatTimeMixin'
import { mapGetters } from 'vuex'

export default {
  mixins: [formatTime],
  data() {
    return {
      invoiceLoadingKey: 0
    }
  },
  computed: {
    ...mapGetters('license', ['license']),
    ...mapGetters('tenant', ['tenant']),
    projectedCost() {
      if (!this.invoice) return 0
      return this.invoice.total * 100
    },
    nextPaymentDate() {
      if (!this.invoice) return null
      const nextPayment = this.invoice.next_payment_attempt * 1000
      return this.formatLongDate(nextPayment)
    },
    periodStart() {
      if (!this.invoice) return null
      return new Date(this.invoice.period_start * 1000)
    },
    invoiceLoading() {
      return this.invoiceLoadingKey > 0
    }
  },
  apollo: {
    invoice: {
      query: require('@/graphql/Dashboard/invoice.gql'),
      variables() {
        return {
          licenseId: this.license.id
        }
      },
      loadingKey: 'invoiceLoadingKey',
      skip() {
        return !this.license?.id
      },
      update: data => data?.preview_invoice
    }
  }
}
</script>

<template>
  <v-card
    class="mb-4 position-relative d-flex flex-column justify-space-between"
    style="height: 157px;"
    tile
  >
    <v-card-text
      class="pa-0 px-3 pt-3 d-flex align-start justify-center flex-column mb-auto"
    >
      <div class="title utilGrayDark--text">Current balance</div>
      <div class="text-h3"
        ><span class="text-h5" style="vertical-align: top;">$</span>
        <v-skeleton-loader
          :loading="invoiceLoading"
          type="image"
          transition="quick-fade"
          height="45"
          width="75"
          tile
          class="d-inline-block"
        >
          <span>
            {{ projectedCost
            }}<span class="text--disabled text-subtitle-1">.00</span>
          </span>
        </v-skeleton-loader>
      </div>
      <div class="subtitle-2 font-weight-light"
        >due
        <v-skeleton-loader
          :loading="invoiceLoading"
          type="image"
          transition="quick-fade"
          height="12"
          width="100"
          tile
          class="d-inline-block"
          style="vertical-align: baseline;"
        >
          <span>
            <span v-if="nextPaymentDate !== 'today'">on </span
            >{{ nextPaymentDate }}
          </span>
        </v-skeleton-loader>
      </div>
    </v-card-text>
    <v-spacer />
    <v-card-actions class="mt-auto">
      <v-spacer />
      <v-btn small color="primary" text :to="'/team/account'">
        Details
      </v-btn>
    </v-card-actions>
  </v-card>
</template>
