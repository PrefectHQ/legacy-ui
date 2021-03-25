<script>
import { formatTime } from '@/mixins/formatTimeMixin'
import { mapGetters } from 'vuex'

import CardTitle from '@/components/Card-Title'
import RingChart from '@/components/Visualizations/RingChart'

export default {
  components: { CardTitle, RingChart },
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
    },
    type() {
      if (!this.license) return 'loading'

      let type = 'monthly'

      if (!this.license.terms.is_self_serve) {
        type = 'committed'
      } else if (!this.license.terms.is_usage_based) {
        type = 'free'
      }
      return type
    },
    chartData() {
      return [
        { label: 'used', value: this.usage },
        { name: 'total', value: 10000 }
      ]
    },
    colors() {
      return ['#27b1ff', '#eee']
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
  <v-skeleton-loader
    v-if="type == 'loading'"
    loading
    type="image"
    transition="quick-fade"
    height="330"
    tile
  />
  <v-card v-else class="py-2 d-flex flex-column" tile style="height: 330px;">
    <CardTitle title="Usage this month" icon="assessment" />

    <v-card-text class="pb-0 d-flex align-center justify-space-around">
      <div>
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
          <div class="text--disabled text-subtitle-1 ml-1"
            >successful task runs</div
          >
        </div>
      </div>

      <div class="position-relative">
        <RingChart
          :segments="chartData"
          :width="190"
          :height="190"
          :colors="colors"
        />

        <div
          class="text-h4 font-weight-light position-absolute center-absolute"
        >
          <v-skeleton-loader
            :loading="!usage && (invoiceLoading || usageLoading)"
            type="image"
            transition="quick-fade"
            height="12"
            width="22"
            tile
          >
            <span class="font-weight-medium" :class="freeUsageStyle">
              {{ freeUsage }}%
            </span>
          </v-skeleton-loader></div
        >
      </div>
    </v-card-text>
    <v-spacer />
    <v-card-actions class="py-0">
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
