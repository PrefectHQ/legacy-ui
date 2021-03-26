<script>
import { formatTime } from '@/mixins/formatTimeMixin'
import { mapGetters } from 'vuex'

import MenuTooltip from '@/components/MenuTooltip'

export default {
  components: {
    MenuTooltip
  },
  mixins: [formatTime],
  data() {
    return {
      usageLoadingKey: 0
    }
  },
  computed: {
    ...mapGetters('license', ['license']),
    ...mapGetters('user', ['isDark']),
    usageLoading() {
      return this.usageLoadingKey > 0
    },
    runsStyle() {
      return {
        [`text--${this.isDark ? 'lighten' : 'darken'}-3`]: this.usage < 10000,
        [`text--${this.isDark ? 'lighten' : 'darken'}-3`]: this.usage < 10000,
        [`text--${this.isDark ? 'lighten' : 'darken'}-2`]: this.usage < 50000,
        [`text--${this.isDark ? 'lighten' : 'darken'}-1`]: this.usage < 100000,
        'primary--text': this.usage > 0,
        'amber--text': this.usage <= 0
      }
    }
  },
  apollo: {
    usage: {
      query: require('@/graphql/Dashboard/committed-usage.gql'),
      variables() {
        return {
          license: this.license?.id
        }
      },
      skip() {
        return !this.license?.id
      },
      loadingKey: 'usageLoadingKey',
      pollInterval: 5000,
      update: data => data?.usage.reduce((prev, val) => (prev += val.runs), 0)
    }
  }
}
</script>

<template>
  <v-card
    class="mb-4 position-relative d-flex flex-column justify-space-between"
    style="height: 100%;"
    tile
  >
    <v-card-text
      class="pa-0 px-3 pt-3 d-flex align-start justify-center flex-column mb-auto"
    >
      <div class="title utilGrayDark--text"
        >Run balance

        <MenuTooltip hide-close>
          <template #activator>
            <v-icon v-if="usage && usage < 0">error_outline</v-icon>
          </template>
          <div>
            <div class="text-h5 font-weight-light">
              You're out of runs!
            </div>
            <div class="text-subtitle-1">
              You've used all your pre-purchased runs; since you have overage
              billing configured, you're paying for each successful task run at
              normal usage rates.
            </div>
          </div>
        </MenuTooltip>
      </div>
      <div class="text-h3">
        <v-skeleton-loader
          :loading="!usage && usageLoading"
          type="image"
          transition="quick-fade"
          height="45"
          width="100"
          tile
          class="d-inline-block"
        >
          <span :class="runsStyle"> {{ usage && usage.toLocaleString() }}</span>
        </v-skeleton-loader>
        <span class="text--disabled text-subtitle-1 ml-1">task runs</span>
      </div>
    </v-card-text>
    <v-spacer />
    <v-card-actions class="mt-auto">
      <v-spacer />
      <v-btn
        color="primary"
        depressed
        dark
        small
        href="https://www.prefect.io/pricing/#contact"
      >
        Add more runs
      </v-btn>
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
