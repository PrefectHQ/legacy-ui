<script>
import { mapActions, mapGetters } from 'vuex'
import { formatTime } from '@/mixins/formatTimeMixin'

import CancelAll from '@/components/Nav/SystemActionsTiles/CancelAll'
import ClearLate from '@/components/Nav/SystemActionsTiles/ClearLate'
import TenantInfo from '@/components/Nav/SystemActionsTiles/TenantInfo'
import RecentFlows from '@/components/Nav/SystemActionsTiles/RecentFlows'
import WorkQueue from '@/components/Nav/SystemActionsTiles/WorkQueue'

export default {
  components: {
    CancelAll,
    ClearLate,
    TenantInfo,
    RecentFlows,
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
    <TenantInfo />
    <CancelAll />
    <ClearLate />
    <WorkQueue />
    <RecentFlows />
  </div>
</template>

<style lang="scss" scoped>
$cellsize: 200px;
$guttersize: 16px;

.system-grid {
  column-gap: $guttersize;
  display: grid;
  grid-auto-flow: row dense;
  grid-auto-rows: minmax($cellsize, auto);
  grid-template-columns: repeat(auto-fit, minmax($cellsize, 1fr));
  height: max-content;
  margin: 104px auto;
  max-height: calc(100% - 136px);
  max-width: 1600px;
  overflow-y: scroll;
  padding: 0 16px;
  row-gap: $guttersize;
  text-align: center;

  .system-action-container {
    background-color: #455a64;
    grid-column: span 1;
    grid-row: span 1;
    height: 100%;
    margin: auto;
    position: relative;
    transition: transform 150ms ease-in-out;
    width: 100%;

    &.system-action-container-large {
      grid-column: span 2;
      grid-row: span 2;

      &.wide {
        grid-column: 1/-1;
      }
    }

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

<style lang="scss">
// stylelint-disable-next-line
.v-overlay__content {
  width: 100%;
}
</style>
