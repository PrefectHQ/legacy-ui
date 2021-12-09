<script>
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      menu: false
    }
  },
  computed: {
    ...mapGetters('license', ['license']),
    flowConcurrency() {
      return this.license?.terms?.flow_concurrency
    }
  },
  methods: {
    onIntersect([entry]) {
      this.$apollo.queries.concurrentRuns.skip = !entry.isIntersecting
    }
  },
  apollo: {
    concurrentRuns: {
      query: require('@/graphql/concurrent-runs.gql'),
      loadingKey: 'loading',
      pollInterval: 3000,
      update({ flow_run }) {
        if (!flow_run) return []
        return flow_run
      }
    }
  }
}
</script>

<template>
  <div v-if="concurrentRuns && license" v-intersect="{ handler: onIntersect }">
    {{ concurrentRuns.length
    }}{{ flowConcurrency ? `/${flowConcurrency}` : '' }} slot{{
      concurrentRuns.length === 1 || flowConcurrency === 1 ? '' : 's'
    }}
    used

    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      offset-y
      transition="slide-y-transition"
    >
      <template #activator="{ on }">
        <v-btn text icon x-small v-on="on">
          <v-icon>
            info
          </v-icon>
        </v-btn>
      </template>
      <v-card tile class="pa-0" max-width="320">
        <v-card-text class="pb-0">
          <div class="text-h6 mb-4">
            <span class="primary--text">{{ concurrentRuns.length }}</span>
            concurrency slots used
          </div>
          <p v-if="!flowConcurrency">
            Your team has
            <span class="font-weight-bold">unlimited</span> flow concurrency, so
            you can run as many concurrent flows as you'd like!
          </p>
          <p v-else>
            Your team has
            <span class="font-weight-bold">{{ flowConcurrency }}</span>
            flow concurrency slot{{ flowConcurrency === 1 ? '' : 's' }}. Flow
            runs in
            <v-chip
              x-small
              label
              dark
              color="Running"
              class="px-1 font-weight-bold"
            >
              Running </v-chip
            >,
            <v-chip
              x-small
              label
              color="Cancelling"
              class="px-1 font-weight-bold"
            >
              Cancelling
            </v-chip>
            or
            <v-chip
              x-small
              label
              color="Submitted"
              class="px-1 font-weight-bold"
            >
              Submitted
            </v-chip>
            states take up concurrency slots; flow runs will remain in
            <v-chip
              x-small
              label
              dark
              color="Scheduled"
              class="px-1 font-weight-bold"
            >
              Scheduled
            </v-chip>
            until a concurrency slot becomes available.
          </p>
          <p v-if="flowConcurrency">
            <a href="https://www.prefect.io/pricing#contact" target="_blank">
              Contact us</a
            >
            to add concurrency slots and to get access to lots of other cool
            features!
          </p>
        </v-card-text>
        <v-card-actions class="pt-0">
          <v-spacer></v-spacer>
          <v-btn small text @click="menu = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>
