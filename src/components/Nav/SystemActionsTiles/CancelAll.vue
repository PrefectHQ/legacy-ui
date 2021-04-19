<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  data() {
    return {
      finished: false,
      errors: 0,
      loaded: 0,
      loadingKey: 0
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    loading() {
      return this.loadingKey > 0
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    async cancelAll() {
      if (!this.flowRuns?.length) return

      try {
        const mutation = require('@/graphql/Nav/cancel-flow-run.gql')

        this.loaded = 0

        const promises = []
        const animationTime = Math.min(10000, this.flowRuns.length * 750)

        this.flowRuns.map(async (run, i) => {
          this.loadingKey++
          const promise = new Promise((res, rej) => {
            this.$apollo
              .mutate({
                mutation: mutation,
                variables: {
                  flowRunId: run.id
                }
              })
              .then(() => {
                setTimeout(() => {
                  this.loaded++
                  res()
                }, animationTime / (750 * (i + 1)))
              })
              .catch(() => {
                this.errors++
                rej()
              })
          })
          promises.push(promise)
        })

        await Promise.allSettled(promises)
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage: e,
          alertType: 'error'
        })
      } finally {
        this.finished = true
        this.$apollo.queries['flowRuns'].refetch()
        setTimeout(() => {
          this.loadingKey = 0
          this.finished = false
        }, 5000)

        if (this.errors > 0) {
          this.setAlert({
            alertShow: true,
            alertMessage: `${this.errors} could not be stopped.`,
            alertType: 'error'
          })

          this.errors = 0
        }
      }
    }
  },
  apollo: {
    flowRuns: {
      query: require('@/graphql/Nav/flow-runs.gql'),
      variables() {
        return {
          tenantId: this.tenant?.id,
          states: ['Running', 'Submitted', 'Queued']
        }
      },
      skip() {
        return this.loading
      },
      pollInterval: 3000,
      update: data => data?.flow_run || []
    }
  }
}
</script>

<template>
  <button
    class="rounded-lg system-action-container d-flex flex-column align-center justify-center"
    :disabled="loading || !flowRuns || flowRuns.length === 0"
    @click="cancelAll"
  >
    <div class="system-icon mx-auto" :class="{ active: !loading }">
      <i class="fad fa-align-slash" />
    </div>

    <div class="text-h6 white--text mt-2 ">
      <v-fade-transition mode="out-in">
        <div v-if="finished" style="transition-delay: 1.5s">Complete!</div>
        <div v-else-if="loading" style="transition-delay: 1.5s"
          >Stopping...</div
        >
        <div v-else style="transition-delay: 1.5s">Stop all runs</div>
      </v-fade-transition>
    </div>

    <v-scroll-y-transition mode="out-in">
      <div v-if="loading" class="action-container">
        <v-progress-linear
          :active="loading"
          height="25"
          rounded
          color="error"
          :value="(loaded / loadingKey) * 100"
        >
          {{ loaded }} / {{ loadingKey }}
        </v-progress-linear>
      </div>
      <div v-else class="action-container mb-2">
        <span v-if="flowRuns && flowRuns.length > 0">
          {{ flowRuns.length }} runs can be stopped</span
        >
        <span v-else>No runs to stop</span>
      </div>
    </v-scroll-y-transition>
  </button>
</template>

<style lang="scss" scoped>
.action-container {
  bottom: 20px;
  left: 10%;
  position: absolute;
  width: 80%;

  // div {
  //   flex-grow: 1;
  //   transition: flex-grow 1000ms linear;
  // }
}
</style>
