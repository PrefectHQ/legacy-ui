<script>
import { mapActions, mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'

import CancelAll from '@/components/Nav/SystemActionsTiles/CancelAll'
import WorkQueue from '@/components/Nav/SystemActionsTiles/WorkQueue'

export default {
  components: {
    CancelAll,
    WorkQueue
  },
  mixins: [formatTime],
  data() {
    return {
      cancelLoading: false,
      clockInterval: null,
      time: Date.now()
    }
  },
  computed: {
    ...mapGetters('data', ['flows']),
    ...mapGetters('tenant', ['tenant']),
    flowIds() {
      return this.flows.map(f => f.id)
    }
  },
  mounted() {
    clearInterval(this.clock)
    this.clockInterval = setInterval(() => {
      this.time = Date.now()
    }, 1000)

    window.addEventListener('keydown', this.close)
  },
  beforeDestroy() {
    clearInterval(this.clockInterval)
    window.removeEventListener('keydown', this.close)
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    close(e) {
      if (e?.key == 'Escape') {
        this.$emit('close')
      }
    },
    async cancelAll() {
      this.cancelLoading = true

      try {
        const { data } = await this.$apollo.query({
          query: require('@/graphql/Nav/flow-runs.gql'),
          variables: {
            flowIds: this.flowIds
          }
        })

        console.log(data)

        if (data?.flow_run) {
          const mutation = require('@/graphql/Nav/cancel-flow-run.gql')
          data.flow_run.map(async run => {
            console.log(run)
            const res = await this.$apollo.mutate({
              mutation: mutation,
              variables: {
                flowRunId: run.id
              }
            })
            console.log(res)
          })
        }
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage: e,
          alertType: 'error'
        })
      } finally {
        this.cancelLoading = false
      }
    }
  }
}
</script>

<template>
  <div class="system-grid">
    <CancelAll />
    <ClearLate />
    <WorkQueue />
  </div>
</template>

<style lang="scss" scoped>
$cellsize: 200px;

.system-grid {
  max-width: 764px;
  text-align: center;

  .system-action-container {
    background-color: #455a64;
    display: inline-block;
    margin: 16px;
    height: $cellsize;
    position: relative;
    transition: transform 150ms ease-in-out;
    width: $cellsize;

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
}
</style>
