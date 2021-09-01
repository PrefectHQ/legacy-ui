<script>
import gql from 'graphql-tag'
import { FINISHED_STATES } from '@/utils/states'

import { formatTime } from '@/mixins/formatTimeMixin'
const computedStyle = getComputedStyle(document.documentElement)
const notPastStates = ['Running', 'Submitted', 'Pending']

export default {
  components: {
    RunStateTooltip: () => import('@/components/RunStateTooltip'),
    TaskRunTooltip: () => import('@/components/TaskRunTooltip'),
    Timeline: () => import('@/components/Visualizations/Timeline')
  },
  mixins: [formatTime],
  props: {
    flowId: {
      type: String,
      required: true
    },
    flowRunId: {
      type: String,
      required: true
    },
    // flowRun: {
    //   type: Object,
    //   required: false,
    //   default: () => {}
    // },
    flowRunEndTime: {
      type: String,
      required: false,
      default: () => null
    },
    flowRunScheduledStartTime: {
      type: String,
      required: false,
      default: () => null
    },
    flowRunStartTime: {
      type: String,
      required: false,
      default: () => null
    },
    flowRunState: {
      type: String,
      required: false,
      default: () => null
    },
    flowRunStates: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  data() {
    return {
      breakpoints: [],
      containerHeight: null,
      hoveredBreakpoints: null,
      hoveredTaskRuns: [],
      loadingKey: 0
    }
  },
  computed: {
    containerStyle() {
      return {
        height: '114px'
      }
    },
    endTime() {
      return this.flowRunEndTime && this.isFinished
        ? Math.max.apply(null, [
            new Date(this.flowRunScheduledStartTime),
            new Date(this.flowRunEndTime),
            this.maxEndTime
          ])
        : null
    },
    filteredFlowRunStates() {
      return this.flowRunStates.filter(state => state.state !== 'Pending')
    },
    startTime() {
      return this.flowRunStartTime
        ? Math.min.apply(null, [
            new Date(this.flowRunScheduledStartTime),
            new Date(this.flowRunStartTime),
            ...this.filteredFlowRunStates.map(
              state => new Date(state.start_time ?? state.timestamp)
            )
          ])
        : this.flowRunScheduledStartTime
    },
    loading() {
      return this.loadingKey > 0
    },
    items() {
      if (!this.tasks) return
      return this.tasks
        .map(task => {
          const taskRun = this.taskRunMap[task.id]
          const mappedRef = this.mappedChildren?.[task.id]
          const isMapped = taskRun?.state == 'Mapped'
          const taskRunIsFinished = FINISHED_STATES.includes(taskRun.state)

          const item = {
            id: task.id,
            label: task.name,
            colors: [],
            start_time: null,
            shadow: false,
            end_time: null,
            links: [],
            data: {
              ...task,
              ...taskRun,
              mappedChildren: mappedRef
            }
          }

          if (!taskRun || (isMapped && !mappedRef)) return item

          if (isMapped) {
            const states = Object.keys(mappedRef.state_counts).sort(
              (s1, s2) => notPastStates.indexOf(s1) - notPastStates.indexOf(s2)
            )
            const total = Object.values(mappedRef.state_counts).reduce(
              (a, b) => a + b,
              0
            )

            states.forEach(state => {
              const color = computedStyle
                .getPropertyValue(`--v-${state}-base`)
                ?.trim()

              item.colors.push({
                color: color,
                value: mappedRef.state_counts[state] / total
              })
            })

            if (item.colors.length == 0) {
              item.colors.push({
                color: computedStyle.getPropertyValue('--v-Mapped-base'),
                value: 1
              })
            }

            item.start_time = mappedRef.min_start_time

            // If we have n_mapped_states and the flow run isn't finished,
            // we attempt to set the end time based on mapped children having
            // all finished states; if any of the mapped children are still pending/submitted/running
            // we assuming the task run is still going and set the end_time to null
            if (taskRun?.serialized_state?.n_map_states && !this.isFinished) {
              item.end_time =
                taskRun?.serialized_state?.n_map_states == total &&
                // !this.isFinished &&
                !states.some(state => notPastStates.includes(state))
                  ? mappedRef.max_end_time
                  : null
              // item.shadow = states.some(state => notPastStates.includes(state))
            } else {
              // Using mappedRef.max_end_time means older versions of Core will visually "jump"
              // as new task runs are taken into account for the calculation of max_end_time
              item.end_time = mappedRef.max_end_time
              // item.shadow = this.flowRun.state == 'Running'
            }
          } else {
            item.start_time = taskRun.start_time
            item.end_time = !taskRunIsFinished ? null : taskRun.end_time ?? null

            const color = computedStyle
              .getPropertyValue(`--v-${taskRun.state}-base`)
              ?.trim()

            item.colors.push({ color: color, value: 1 })
            // item.shadow =
            // taskRun.state == 'Running' || taskRun.state == 'Pending'
          }

          if (
            (this.isFinished || (taskRunIsFinished && !isMapped)) &&
            !item.end_time
          ) {
            item.end_time = taskRun.start_time
              ? taskRun.start_time
              : taskRun.state_timestamp
          }

          if ((this.isFinished || taskRunIsFinished) && !item.start_time) {
            item.start_time = taskRun.state_timestamp
            item.end_time = taskRun.state_timestamp
            item.shadow = false
          }

          return item
        })
        .sort((a, b) => {
          if (!a.start_time && b.start_time) return 1
          if (!b.start_time && a.start_time) return -1
          if (!a.start_time && !b.start_time) return 0
          return new Date(a.start_time) - new Date(b.start_time)
        })
    },
    maxEndTime() {
      return Math.max.apply(null, [
        ...this.items.map(item => new Date(item.end_time)),
        ...this.flowRunStates.map(state => new Date(state.timestamp))
      ])
    },
    isFinished() {
      return (
        FINISHED_STATES.includes(this.flowRunState) &&
        this.flowRunState !== 'Scheduled'
      )
    },
    mappedTaskRuns() {
      return this.taskRuns?.filter(taskRun => taskRun.state == 'Mapped')
    },
    mappedChildrenQuery() {
      return this.mappedTaskRuns
        ?.map(
          (taskRun, index) => `
         mapped_run_${index}: mapped_children(task_run_id: "${taskRun.id}") {
            max_end_time
            min_start_time
            state_counts
          }
      `
        )
        .join(' ')
    },
    taskRunMap() {
      if (!this.taskRuns || !this.tasks) return {}
      const taskRunMap = {}
      this.tasks.map(task => {
        const run = this.taskRuns.find(tr => tr.task_id == task.id)
        taskRunMap[task.id] = run ?? {}
        taskRunMap[task.id].task_id = task.id
        taskRunMap[task.id].task_name = task.name
      })

      return taskRunMap
    }
  },
  watch: {
    flowRun() {
      this.$apollo.queries.taskRuns.stopPolling()
      this.$apollo.queries.tasks.stopPolling()
      this.$apollo.queries.mappedChildren.stopPolling()

      if (this.isFinished) {
        this.$apollo.queries.taskRuns.startPolling(60000)
        this.$apollo.queries.mappedChildren.startPolling(60000)
      } else {
        this.$apollo.queries.taskRuns.startPolling(3000)
        this.$apollo.queries.tasks.startPolling(30000)
        this.$apollo.queries.mappedChildren.startPolling(5000)
      }

      this.generateBreakpoints()
    }
  },
  mounted() {
    if (this.isFinished) {
      this.$apollo.queries.taskRuns.stopPolling()
      this.$apollo.queries.tasks.stopPolling()
      this.$apollo.queries.mappedChildren.stopPolling()

      this.$apollo.queries.taskRuns.startPolling(60000)
      this.$apollo.queries.tasks.startPolling(60000)
      this.$apollo.queries.mappedChildren.startPolling(60000)
    }

    this.generateBreakpoints()

    this.containerHeight = getComputedStyle(
      this.$refs['timeline-container']
    ).height
  },
  methods: {
    generateBreakpoints() {
      this.breakpoints = this.filteredFlowRunStates.map(state => {
        return {
          label: state.state,
          time: state.start_time ?? state.timestamp,
          color: computedStyle.getPropertyValue(`--v-${state.state}-base`)
        }
      })
    },
    handleClick(e) {
      if (!e.id) return

      const taskRun = this.items.find(item => e?.id == item.id)
      if (!taskRun) return

      this.$router.push({
        name: 'task-run',
        params: {
          id: taskRun.data.id
        }
      })
    },
    handleHover(e) {
      this.hoveredTaskRuns = this.items.filter(item =>
        e?.ids?.includes(item.id)
      )
    },
    handleBreakpointHover(e) {
      e?.breakpoints.forEach(b => {
        b.formattedTime = this.logTime(b.time)
      })
      this.hoveredBreakpoints = e?.breakpoints
    }
  },
  apollo: {
    taskRuns: {
      query: require('@/graphql/FlowRun/timeline-chart-task-runs.gql'),
      variables() {
        return {
          flowRunId: this.flowRunId
        }
      },
      skip() {
        return !this.flowId || !this.tasks
      },
      loadingKey: 'loadingKey',
      pollInterval: 60000,
      update: data => data.task_run
    },
    tasks: {
      query: require('@/graphql/FlowRun/timeline-chart-tasks.gql'),
      variables() {
        return {
          flowId: this.flowId
        }
      },
      skip() {
        return !this.flowRunId
      },
      loadingKey: 'loadingKey',
      update: data => data.task
    },
    mappedChildren: {
      query() {
        return gql`
        query MappedChildren {
          ${this.mappedChildrenQuery}
        }
      `
      },
      skip() {
        return !this.taskRuns || !this.mappedTaskRuns.length
      },
      pollInterval: 60000,
      update(data) {
        // Since mapped_children doesn't return an id (and we can't do this mapping with GraphQL)
        // we map those here instead
        const mappedTaskMap = {}
        Object.keys(data).forEach(
          (key, index) =>
            (mappedTaskMap[this.mappedTaskRuns[index]?.task_id] = {
              ...data[key],
              parent_id: this.mappedTaskRuns[index]?.id,
              task_id: this.mappedTaskRuns[index]?.task_id
            })
        )
        return mappedTaskMap
      }
    }
  }
}
</script>

<template>
  <v-card
    class="px-3 pt-7 pb-2 mx-auto"
    style="
      max-height: 200px;"
    tile
  >
    <div class="text-caption text-left grey--text timeline-title">
      <v-icon x-small>pi-gantt</v-icon><span class="ml-1">Timeline</span>
    </div>

    <div
      v-if="!loading && items.length === 0"
      class="text-caption text-center grey--text timeline-no-runs"
    >
      No timeline
    </div>

    <v-card-text
      ref="timeline-container"
      class="timeline-container pa-0"
      style="height: 150px;"
    >
      <!-- 
            :condensed="condensed"
        :min-bar-radius="10" -->
      <Timeline
        v-if="taskRuns && items"
        :items="items"
        :start-time="startTime"
        :end-time="endTime"
        :loading="loading && (!tasks || !taskRuns)"
        :breakpoints="breakpoints"
        :live="!isFinished"
        :height="containerHeight"
        @breakpoint-hover="handleBreakpointHover"
        @hover="handleHover"
        @click="handleClick"
      >
        <template slot="item-tooltip">
          <v-fade-transition mode="out-in">
            <TaskRunTooltip
              v-if="hoveredTaskRuns.length"
              :task-runs="hoveredTaskRuns"
            />
          </v-fade-transition>
        </template>

        <template slot="breakpoint-tooltip">
          <v-fade-transition mode="out-in">
            <RunStateTooltip
              v-if="hoveredBreakpoints"
              :states="hoveredBreakpoints"
            />
          </v-fade-transition>
        </template>
      </Timeline>
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.timeline-title {
  left: 8px;
  position: absolute;
  top: 8px;
}

.timeline-no-runs {
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
