<script>
import CardTitle from '@/components/Card-Title'
import HeartbeatTimeline from '@/components/HeartbeatTimeline'
import { heartbeatMixin } from '@/mixins/heartbeatMixin.js'

export default {
  components: {
    CardTitle,
    HeartbeatTimeline
  },
  mixins: [heartbeatMixin],
  // These should eventually be moved here as data props
  // instead of as passed in props
  props: {
    aggregate: {
      type: Boolean,
      default: () => false
    },
    flow: {
      type: Object,
      required: true
    }
  },
  data() {
    return { loading: 0 }
  },
  computed: {
    pollInterval() {
      return this.flow.archived ? 0 : 10000
    }
  },
  watch: {
    flow() {
      this.$apollo.queries.heartbeat.stopPolling()

      if (this.pollInterval > 0) {
        this.$apollo.queries.heartbeat.startPolling(this.pollInterval)
      } else {
        this.$apollo.queries.heartbeat.refetch()
      }
    }
  },
  mounted() {
    if (this.pollInterval > 0) {
      this.$apollo.queries.heartbeat.startPolling(this.pollInterval)
    }
  },
  methods: {
    onIntersect([entry]) {
      this.$apollo.queries.heartbeat.skip = !entry.isIntersecting
    }
  },
  apollo: {
    heartbeat: {
      query: require('@/graphql/Flow/heartbeat.gql'),
      update: d => d.flow_run,
      loadingKey: 'loading',
      variables() {
        let variables = {
          state: this.checkedState,
          filterOutStates: 'Scheduled'
        }

        if (this.aggregate) {
          variables.flow_group_id = this.flow.flow_group_id
        } else {
          variables.flow_id = this.flow.id
        }

        return variables
      }
    }
  }
}
</script>

<template>
  <v-card v-intersect="{ handler: onIntersect }" class="pa-2" tile>
    <CardTitle title="Activity" icon="show_chart" :icon-color="state">
      <v-select
        data-publicß
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
          <v-icon color="utilGrayDark" x-small>
            label_important
          </v-icon>
        </template>
      </v-select>
    </CardTitle>

    <v-container class="pa-0 pr-4">
      <HeartbeatTimeline
        :loading="loading"
        :items="heartbeat"
        type="flow_run"
      />
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
