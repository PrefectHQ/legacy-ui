<script>
import { formatTime } from '@/mixins/formatTimeMixin'
import { mapGetters } from 'vuex'

export default {
  mixins: [formatTime],
  data() {
    return {
      usageLoadingKey: 0,
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
    freeUsage() {
      if (isNaN(this.usage)) return null
      const percentage = this.usage / 10000
      return percentage > 1 ? 100 : percentage * 100
    },
    usageLoading() {
      return this.usageLoadingKey > 0
    },
    invoiceLoading() {
      return this.invoiceLoadingKey > 0
    },
    freeUsageStyle() {
      return {
        'prefect--text text--darken-4':
          this.freeUsage > 0 && this.freeUsage < 60,
        'prefect--text text--darken-3':
          this.freeUsage >= 60 && this.freeUsage < 80,
        'prefect--text text--darken-2':
          this.freeUsage >= 80 && this.freeUsage < 100,
        'prefect--text text--darken-1': this.freeUsage == 100
      }
    }
  },
  apollo: {
    usage: {
      query: require('@/graphql/Dashboard/usage.gql'),
      variables() {
        return {
          from: this.periodStart,
          tenant_id: this.tenant.id
        }
      },
      loadingKey: 'usageLoadingKey',
      skip() {
        return !this.invoice
      },
      pollInterval: 120000,
      update: data =>
        data?.usage
          .filter(u => u.kind == 'USAGE')
          .reduce((prev, val) => (prev += Math.abs(val.runs)), 0)
    },
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
      <div class="title utilGrayDark--text">Usage this cycle</div>
      <div class="text-h3">
        <v-skeleton-loader
          :loading="!usage && (invoiceLoading || usageLoading)"
          type="image"
          transition="quick-fade"
          height="45"
          width="100"
          tile
          class="d-inline-block"
        >
          <span>
            {{ usage && usage.toLocaleString() }}
          </span>
        </v-skeleton-loader>
        <span class="text--disabled text-subtitle-1 ml-1"
          >successful task runs</span
        >
      </div>
      <div class="subtitle-2 font-weight-light">
        <v-skeleton-loader
          :loading="!usage && (invoiceLoading || usageLoading)"
          type="image"
          transition="quick-fade"
          height="12"
          width="22"
          tile
          class="d-inline-block"
          style="vertical-align: baseline;"
        >
          <span class="font-weight-medium" :class="freeUsageStyle">
            {{ freeUsage }}
          </span> </v-skeleton-loader
        ><span class="font-weight-medium" :class="freeUsageStyle">% </span>
        <span class="text-normal text--disabled font-weight-light"
          >of free runs used</span
        ></div
      >
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

<style lang="scss" scoped>
.center-absolute {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
