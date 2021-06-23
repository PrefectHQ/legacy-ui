<script>
import { mapGetters } from 'vuex'
export default {
  data() {
    return {
      loadingKey: 0,
      // Domain
      from: null,
      to: null
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    loading() {
      return this.loadingKey > 0
    }
  },
  mounted() {
    this.from = new Date()
    this.from.setMinutes(0)
    this.from.setHours(0)

    this.to = new Date()
    this.to.setMinutes(59)
    this.to.setHours(23)

    this.$apollo.queries['usage'].refetch()
  },
  apollo: {
    usage: {
      query: require('@/graphql/TeamSettings/usage.gql'),
      variables() {
        return {
          from: this.from,
          to: this.to,
          tenant_id: this.tenant.id
        }
      },
      skip() {
        return !this.from || !this.to
      },
      loadingKey: 'loadingKey',
      update: data =>
        data?.usage
          .filter(u => u.kind == 'USAGE')
          .reduce((prev, val) => (prev += Math.abs(val.runs)), 0)
          ?.toLocaleString()
    }
  }
}
</script>

<template>
  <v-card tile class="f-wh py-8 d-flex flex-column align-center justify-center">
    <div class="rounded pa-3 primary">
      <v-icon x-large color="white">
        fad fa-tasks
      </v-icon>
    </div>

    <div class="text-center">
      <div class="text-subtitle-1 text--disabled">Task runs today</div>

      <v-skeleton-loader
        :loading="loading"
        type="image"
        transition="quick-fade"
        height="36"
        tile
      >
        <div class="text-h4">
          {{ usage }}
        </div>
      </v-skeleton-loader>
    </div>
  </v-card>
</template>

<style lang="scss" scoped>
.f-wh {
  height: 100%;
  width: 100%;
}
</style>
