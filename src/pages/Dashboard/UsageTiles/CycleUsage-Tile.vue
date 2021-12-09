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
    ...mapGetters('license', ['license', 'planType']),
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
      const percentage = this.usage / 20000
      return percentage > 1 ? 100 : (percentage * 100).toFixed()
    },
    usageLoading() {
      return this.usageLoadingKey > 0
    },
    invoiceLoading() {
      return this.invoiceLoadingKey > 0
    },
    freeUsageStyle() {
      return {
        [`text--${this.isDark ? 'lighten' : 'darken'}-3`]:
          this.freeUsage > 0 && this.freeUsage < 60,
        [`text--${this.isDark ? 'lighten' : 'darken'}-2`]:
          this.freeUsage >= 60 && this.freeUsage < 80,
        [`text--${this.isDark ? 'lighten' : 'darken'}-1`]:
          this.freeUsage >= 80 && this.freeUsage < 100,
        'primary--text': true
      }
    }
  },
  methods: {
    onIntersect([entry]) {
      this.$apollo.queries.usage.skip = !entry.isIntersecting
    }
  },
  apollo: {
    usage: {
      query: require('@/graphql/Dashboard/usage.gql'),
      variables() {
        return {
          from: this.periodStart,
          license_id: this.license.id
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
          .reduce((prev, val) => (prev += Math.abs(val.runs)), 0) || 0
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
    v-intersect="{ handler: onIntersect }"
    class="position-relative d-flex flex-column justify-space-between"
    style="height: 100%;"
    tile
  >
    <v-card-title class="text-h4 font-weight-light"
      >Usage this cycle</v-card-title
    >
    <v-card-text
      class="pa-3 pt-0 d-flex align-start justify-center flex-column mb-auto"
    >
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
            {{ !usage ? 0 : usage.toLocaleString()
            }}<span v-if="planType('FREE')" class="text-h5 ml-1"
              >/20,000</span
            ></span
          >
        </v-skeleton-loader>
        <span class="text--disabled text-subtitle-1 ml-1"
          >successful task runs</span
        >
      </div>
      <div class="text-subtitle-2 font-weight-light">
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
        <span
          v-if="planType('FREE')"
          class="text-normal text--disabled font-weight-light"
          >of runs used</span
        ><span v-else class="text-normal text--disabled font-weight-light"
          >of free runs used</span
        ></div
      >
    </v-card-text>
    <v-spacer />
    <v-card-actions v-if="planType('FREE')" class="mt-auto">
      <v-spacer />
      <v-btn
        color="accentPink"
        depressed
        dark
        small
        target="_blank"
        :to="'/plans'"
      >
        Get more runs
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
