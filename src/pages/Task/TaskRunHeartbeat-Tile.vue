<script>
import CardTitle from '@/components/Card-Title'
import HeartbeatTimeline from '@/components/HeartbeatTimeline'
import { roundedOneAgo } from '@/utils/dateTime'
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
    taskId: {
      type: String,
      required: true
    },
    timestamp: {
      type: String,
      required: false,
      default: () => roundedOneAgo('hour')
    }
  },
  data() {
    return { loading: 0 }
  },
  methods: {
    onIntersect([entry]) {
      this.$apollo.queries.heartbeat.skip = !entry.isIntersecting
    }
  },
  apollo: {
    heartbeat: {
      query: require('@/graphql/Task/heartbeat.gql'),
      update: d => d.task_run,
      loadingKey: 'loading',
      pollInterval: 10000,
      variables() {
        return {
          taskId: this.taskId,
          timestamp: roundedOneAgo('hour'),
          state: this.checkedState
        }
      }
    }
  }
}
</script>

<template>
  <v-card v-intersect="{ handler: onIntersect }" class="pa-2" tile>
    <CardTitle title="Activity in the last hour" icon="show_chart">
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
        style="max-width: 150px;"
      >
        <template #prepend-inner>
          <v-icon color="utilGrayDark" x-small>
            label_important
          </v-icon>
        </template>
      </v-select>
    </CardTitle>

    <v-container class="pa-0 pr-4">
      <HeartbeatTimeline :loading="loading" :items="heartbeat" type="task" />
    </v-container>
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
