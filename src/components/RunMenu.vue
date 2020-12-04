<script>
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'
import FlowName from '@/pages/Calendar/FlowName'

export default {
  components: {
    DurationSpan,
    FlowName
  },
  mixins: [formatTime],
  props: {
    run: { type: Object, required: false, default: () => {} },
    type: { type: String, required: false, default: 'task-run' }
  },
  computed: {},
  methods: {
    statusStyle(state) {
      return {
        'border-radius': '50%',
        display: 'inline-block',
        'background-color': `var(--v-${state}-base)`,
        height: '1rem',
        width: '1rem'
      }
    }
  },
  apollo: {
    flowRun: {
      query() {
        return require('@/graphql/Calendar/flow-run-task-runs.gql')
      },
      skip() {
        return !this.run.id
      },
      variables() {
        return {
          id: this.run.id
        }
      },
      update: data => data.flow_run_by_pk
    }
  }
}
</script>

<template>
  <v-card tile>
    <v-card-title class="text-subtitle-1 ">
      <router-link :to="{ name: type, params: { id: run.id } }" target="_blank">
        {{ run.name ? run.name : run.task_name }}
        {{ run.map_index > -1 ? `(${run.map_index})` : '' }}
      </router-link>
      <v-icon x-small>
        open_in_new
      </v-icon>
    </v-card-title>
    <v-card-subtitle v-if="type === 'flow-run'">
      <FlowName :id="run.flow.flow_group_id" left /><span class="caption"
        >(Version: {{ run.flow.version }})</span
      >
    </v-card-subtitle>
    <v-card-text>
      <div>
        State:
        <span :style="statusStyle(run.state)"></span>
        <span class="font-weight-bold"> {{ run.state }}</span>
      </div>
      <div v-if="run.start_time" class="subtitle">
        Duration:
        <DurationSpan
          class="font-weight-bold"
          :start-time="run.start_time"
          :end-time="run.end_time"
        />
      </div>
      <div v-if="run.start_time" class="subtitle">
        Start:
        <span class="font-weight-bold">
          {{ formatTime(run.start_time) }}
        </span>
      </div>
      <div v-if="run.end_time" class="subtitle ">
        End:
        <span class="font-weight-bold">
          {{ formatTime(run.end_time) }}
        </span>
      </div>
      <div v-if="run.state_timestamp" class="subtitle">
        Updated:
        <span class="font-weight-bold">
          {{ formatTime(run.state_timestamp) }}
        </span>
      </div>
      <div v-if="type === 'task-run'">
        <div class="subtitle">
          Max Retries:
          <span class="font-weight-bold">
            {{ run.max_retries || 0 }}
          </span>
        </div>
        <div class="subtitle">
          Retry delay:
          <span class="font-weight-bold">
            {{ run.retry_delay || 0 }}
          </span>
        </div>
        <v-divider class="my-2" />
        <div class="text-subtitle-1">
          <div>Message:</div>
          <div class="font-weight-bold">
            {{ run.state_message || 'No message' }}
          </div>
        </div>
        <v-divider class="my-2" />
        <div class="text-subtitle-1">
          <div>Result:</div>
          <div class="font-weight-bold">
            {{ run.state_result || 'No result' }}
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>
