<script>
import { mapGetters } from 'vuex'
export default {
  data() {
    return {
      workHalted: false
    }
  },
  computed: {
    ...mapGetters('data', ['flows']),
    flowIds() {
      console.log(this.flows)
      return this.flows.map(f => f.id)
    }
  },
  methods: {
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
    async haltWork(val) {
      console.log(val)
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
        v-model="workHalted"
        color="accentPink"
        inset
        hide-details
        class="small-switch pl-4"
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
