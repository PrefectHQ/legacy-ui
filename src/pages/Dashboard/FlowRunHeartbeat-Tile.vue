<script>
import CardTitle from '@/components/Card-Title'
import HeartbeatTimeline from '@/components/HeartbeatTimeline'
import { heartbeatMixin } from '@/mixins/heartbeatMixin.js'
import { mapGetters } from 'vuex'
import { roundedOneAgo } from '@/utils/dateTime'

export default {
  components: { CardTitle, HeartbeatTimeline },
  mixins: [heartbeatMixin],
  // These should eventually be moved here as data props
  // instead of as passed in props
  props: {
    projectId: {
      type: String,
      required: false,
      default: () => null
    }
  },
  data() {
    return { loading: 0 }
  },
  computed: {
    ...mapGetters('tenant', ['tenant'])
  },
  watch: {
    tenant(val) {
      if (val) {
        this.loading = 1
        setTimeout(async () => {
          await this.$apollo.queries.heartbeat.refetch(), (this.loading = 0)
        }, 1000)
      }
    }
  },
  methods: {
    onIntersect([entry]) {
      this.$apollo.queries.heartbeat.skip = !entry.isIntersecting
    }
  },
  apollo: {
    heartbeat: {
      query: require('@/graphql/Dashboard/heartbeat.gql'),
      update: d => d.flow_run,
      loadingKey: 'loading',
      variables() {
        return {
          projectId: this.projectId ? this.projectId : null,
          timestamp: roundedOneAgo('month'),
          state: this.checkedState,
          filterOutStates: 'Scheduled'
        }
      },
      pollInterval: 10000
    }
  }
}
</script>

<template>
  <v-card
    v-intersect="{ handler: onIntersect }"
    class="pa-2"
    style="height: 100%;"
    tile
  >
    <CardTitle title="Activity" icon="show_chart">
      <v-select
        data-public
        slot="action"
        v-model="state"
        class="state-interval-picker font-weight-regular"
        :items="states"
        label="State"
        dense
        solo
        hide-details
        flat
      >
        <template #prepend-inner>
          <v-icon color="black" x-small>
            label_important
          </v-icon>
        </template>
      </v-select>
    </CardTitle>

    <v-container class="pa-0 pr-4">
      <HeartbeatTimeline :loading="loading" :items="heartbeat" type="project" />
    </v-container>

    <v-divider></v-divider>
  </v-card>
</template>

<style lang="scss" scoped>
.state-interval-picker {
  font-size: 0.85rem;
  margin: auto;
  margin-right: 0;
  max-width: 150px;
}
</style>
