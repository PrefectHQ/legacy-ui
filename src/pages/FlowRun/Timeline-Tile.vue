<script>
import gql from 'graphql-tag'
import { FINISHED_STATES } from '@/utils/states'

const computedStyle = getComputedStyle(document.documentElement)

export default {
  components: {
    Timeline: () => import('@/components/Visualizations/Timeline')
  },
  props: {
    flowId: {
      type: String,
      required: true
    },
    flowRunId: {
      type: String,
      required: true
    },
    flowRun: {
      type: Object,
      required: false,
      default: () => {}
    }
  },
  data() {
    return {
      breakpoints: []
    }
  },
  computed: {
    endTime() {
      return this.flowRun.end_time
        ? Math.max.apply(null, [
            new Date(this.flowRun.scheduled_start_time),
            new Date(this.flowRun.end_time),
            this.maxItemEndTime
          ])
        : null
    },
    startTime() {
      return this.flowRun.start_time
        ? Math.min.apply(null, [
            new Date(this.flowRun.scheduled_start_time),
            new Date(this.flowRun.start_time)
          ])
        : this.flowRun.scheduled_start_time
    },
    items() {
      if (!this.tasks) return
      return this.tasks.map(task => {
        const taskRun = this.taskRunMap[task.id]
        const mappedRef = this.mappedChildren?.[task.id]
        const isMapped = taskRun?.state == 'Mapped'

        const item = {
          id: task.id,
          label: task.name,
          colors: {},
          start_time: null,
          end_time: null,
          links: []
        }

        if (!taskRun || (isMapped && !mappedRef)) return item

        if (isMapped) {
          item.start_time = mappedRef.min_start_time
          item.end_time = mappedRef.max_end_time

          const states = Object.keys(mappedRef.state_counts)
          const total = Object.values(mappedRef.state_counts).reduce(
            (a, b) => a + b,
            0
          )

          states.forEach(state => {
            const color = computedStyle
              .getPropertyValue(`--v-${state}-base`)
              ?.trim()

            item.colors[color] = mappedRef.state_counts[state] / total
          })
        } else {
          item.start_time = taskRun.start_time
          item.end_time = taskRun.end_time
            ? taskRun.end_time
            : taskRun.state == 'Running'
            ? null
            : item.start_time

          const color = computedStyle
            .getPropertyValue(`--v-${taskRun.state}-base`)
            ?.trim()

          item.colors[color] = 1
        }

        return item
      })
    },
    maxItemEndTime() {
      return Math.max.apply(
        null,
        this.items.map(item => new Date(item.end_time))
      )
    },
    isFinished() {
      return (
        FINISHED_STATES.includes(this.flowRun.state) &&
        this.flowRun.state !== 'Scheduled'
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
    pollInterval() {
      return this.flowRun.state === 'Running' ? 1000 : 0
    },
    taskRunMap() {
      if (!this.taskRuns) return {}
      const taskRunMap = {}
      this.taskRuns.forEach(taskRun => {
        taskRunMap[taskRun.task_id] = taskRun
      })

      return taskRunMap
    }
  },
  watch: {
    flowRun() {
      this.$apollo.queries.taskRuns.stopPolling()

      if (this.pollInterval > 0) {
        this.$apollo.queries.taskRuns.startPolling(this.pollInterval)
      } else {
        this.$apollo.queries.taskRuns.refetch()
      }

      this.generateBreakpoints()
    }
  },
  mounted() {
    this.generateBreakpoints()
  },
  methods: {
    generateBreakpoints() {
      this.breakpoints = [
        {
          label: 'Scheduled',
          time: this.flowRun?.scheduled_start_time,
          color: computedStyle.getPropertyValue('--v-Scheduled-base')
        },
        {
          label: 'Submitted',
          time: this.flowRun?.states.find(state => state.state == 'Submitted')
            ?.timestamp,
          color: computedStyle.getPropertyValue('--v-Submitted-base')
        },
        {
          label: 'Start',
          time: this.flowRun?.start_time,
          color: computedStyle.getPropertyValue('--v-Running-base')
        },
        {
          label: 'End',
          time: this.flowRun?.end_time,
          color: computedStyle.getPropertyValue(
            `--v-${this.flowRun?.state}-base`
          )
        }
      ]
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
      pollInterval: 3000,
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
      pollInterval: 3000,
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
      pollInterval: 3000,
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
  <div ref="timeline-container" class="d-flex flex-column h-100">
    <Timeline
      v-if="items"
      :items="items"
      collapsed
      :start-time="startTime"
      :end-time="endTime"
      :breakpoints="breakpoints"
      :live="!isFinished"
      :bar-radius="10"
    />
  </div>
</template>
