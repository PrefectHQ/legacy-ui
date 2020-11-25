<script>
import DurationSpan from '@/components/DurationSpan'
import { formatTime } from '@/mixins/formatTimeMixin'
import FlowName from '@/pages/Calendar/FlowName'
import RingChart from '@/components/Visualizations/RingChart'
import { STATE_COLORS } from '@/utils/states'
export default {
  components: {
    DurationSpan,
    FlowName,
    RingChart
  },
  mixins: [formatTime],
  props: {
    run: { type: Object, required: false, default: () => {} },
    type: { type: String, required: false, default: 'task-run' }
  },
  // data() {
  //   return {
  //     colors: STATE_COLORS
  //   }
  // },
  computed: {
    print() {
      console.log('alow task runs', this.flowRun)
      return true
    },
    colors() {
      if (this.segments) return this.segments.map(segment => segment.color)
      return null
    },
    segments() {
      const states = Object.keys(STATE_COLORS).sort()
      let stateArr = []
      states.forEach(state => {
        const val = this.flowRun.task_runs.filter(
          taskRun => taskRun.state === state
        )
        if (val.length) {
          stateArr.push({
            label: state,
            value: val.length,
            color: STATE_COLORS[state]
          })
        }
      })
      console.log('statesArr', stateArr)
      return stateArr
    }
  },
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
  <v-card v-if="print" tile>
    <v-card-title class="text-subtitle-1 ">
      <router-link :to="{ name: type, params: { id: run.id } }">
        {{ run.name ? run.name : run.task_name }}
        {{ run.map_index > -1 ? `(${run.map_index})` : '' }}
      </router-link>

      <div v-if="type === 'flow-run'" class="pl-4 max-width">
        <FlowName :id="run.flow_id" />
      </div>
    </v-card-title>
    <v-card-text>
      <RingChart
        :colors="colors"
        :segments="segments"
        :width="200"
        :height="200"
        :inner-radius="20"
        :outer-radius="80"
      />
      <div>
        State:
        <span :style="statusStyle(run.state)"></span>
        <span class="font-weight-bold"> {{ run.state }}</span>
      </div>
      <div
        v-if="run.start_time"
        class="subtitle d-flex align-end justify-space-between"
      >
        Duration:
        <DurationSpan
          class="font-weight-bold"
          :start-time="run.start_time"
          :end-time="run.end_time"
        />
      </div>
      <div
        v-if="run.start_time"
        class="subtitle d-flex align-end justify-space-between"
      >
        Start:
        <span class="font-weight-bold">
          {{ formatTime(run.start_time) }}
        </span>
      </div>
      <div
        v-if="run.end_time"
        class="subtitle d-flex align-end justify-space-between"
      >
        End:
        <span class="font-weight-bold">
          {{ formatTime(run.end_time) }}
        </span>
      </div>
      <div
        v-if="run.state_timestamp"
        class="subtitle d-flex align-end justify-space-between"
      >
        Updated:
        <span class="font-weight-bold">
          {{ formatTime(run.state_timestamp) }}
        </span>
      </div>
      <div v-if="type === 'task-run'">
        <div class="subtitle d-flex align-end justify-space-between">
          Max Retries:
          <span class="font-weight-bold">
            {{ run.max_retries || 0 }}
          </span>
        </div>
        <div class="subtitle d-flex align-end justify-space-between">
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

<style scss scoped>
.max-width {
  max-width: 100%;
}
</style>
