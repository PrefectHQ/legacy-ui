<script>
import { mapActions, mapGetters } from 'vuex'
export default {
  data() {
    return {
      queueLoading: false,
      queuePaused: this.tenant?.settings?.work_queue_paused
    }
  },
  computed: {
    ...mapGetters('data', ['flows']),
    ...mapGetters('tenant', ['tenant']),
    flowIds() {
      return this.flows.map(f => f.id)
    }
  },
  watch: {
    'settings.work_queue_paused'(val) {
      this.queuePaused = val
    }
  },
  mounted() {
    console.log(this.tenant.settings)
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapActions('tenant', ['getTenants']),
    async cancelAll() {
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
    },
    async haltWork() {
      this.queueLoading = true

      try {
        const { data } = await this.$apollo.mutate({
          mutation: require(`@/graphql/Nav/${
            this.queuePaused ? 'resume' : 'pause'
          }-tenant-work-queue.gql`),
          variables: {
            tenantId: this.tenant.id
          }
        })

        if (data?.tenant_work_queue_result?.success) {
          await this.getTenants()

          this.queuePaused = this.tenant.settings.work_queue_paused
        }
      } catch (e) {
        this.setAlert({
          alertShow: true,
          alertMessage: e,
          alertType: 'error'
        })
      } finally {
        this.queueLoading = false
      }
      // console.log(res)
    }
  }
}
</script>

<template>
  <v-toolbar
    dense
    flat
    color="transparent"
    class="system-actions mx-16 align-center"
    height="64"
  >
    <v-spacer></v-spacer>

    <div class="text-center mr-4">
      <v-switch
        color="accentPink"
        inset
        hide-details
        class="small-switch pl-4"
        :input-value="!queuePaused"
        :loading="queueLoading"
        @change="haltWork"
      />

      <div class="text-caption text-small utilGrayDark--text mt-1">
        Halt
      </div>
    </div>

    <div class="text-center" @click="cancelAll">
      <v-btn class="systembar-icon" icon>
        <i class="fad fa-stop-circle fa-2x" />
      </v-btn>

      <div class="text-caption text-small utilGrayDark--text">Cancel all</div>
    </div>
  </v-toolbar>
</template>

<style lang="scss" scoped>
.system-actions {
  border-color: rgba(255, 255, 255, 0.26) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.26) !important;
}

.text-small {
  font-size: 0.65rem !important;
  text-transform: uppercase;
}

.small-switch {
  transform: scale(0.85);
}
</style>
