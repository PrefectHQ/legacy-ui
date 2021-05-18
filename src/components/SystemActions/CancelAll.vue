<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  props: {
    flowRuns: {
      type: Array,
      required: false,
      default: () => []
    }
  },
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
        const mutation = require('@/graphql/Mutations/cancel-flow-run.gql')

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
        setTimeout(() => {
          this.$emit('finish')
        }, 1500)
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
  }
}
</script>

<template>
  <button
    class="rounded-lg action-container d-flex flex-column align-center justify-center"
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
      <div v-if="loading" class="action-text">
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
      <div v-else class="action-text mb-2">
        <span v-if="flowRuns && flowRuns.length > 0">
          {{ flowRuns.length }} run{{ flowRuns.length == 1 ? '' : 's' }} can be
          stopped</span
        >
        <span v-else>No runs to stop</span>
      </div>
    </v-scroll-y-transition>
  </button>
</template>

<style lang="scss" scoped>
.action-container {
  background-color: #455a64;
  height: 100%;
  margin: auto;
  padding: 36px 36px 52px 36px;
  position: relative;
  transition: transform 150ms ease-in-out;
  width: 180px;

  &:focus {
    outline: none;
  }

  &:active {
    outline: none;
    transform: scale(0.97);
  }

  &:disabled {
    background-color: #90a4ae;
    color: #eee;
    cursor: not-allowed;
  }
}

.action-text {
  bottom: 20px;
  left: 10%;
  position: absolute;
  width: 80%;
}
</style>
