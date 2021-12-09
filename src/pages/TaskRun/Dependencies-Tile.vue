<script>
import CardTitle from '@/components/Card-Title'
import { mapGetters } from 'vuex'
import SchematicFlow from '@/components/Schematics/Schematic-Flow'

import gql from 'graphql-tag'

const taskRunFields = `
  id
  task_run_id: id
  map_index
  name
  state
  task_id
  serialized_state
  state_message
  state_timestamp
  start_time
  end_time
  map_index

  task {
    id
    mapped
    name
    max_retries
    retry_delay
    trigger
    type

    upstream_edges {
      upstream_task {
        id
        name
      }

      downstream_task {
        id
        name
      }
    }

    downstream_edges {
      upstream_task {
        id
        name
      }

      downstream_task {
        id
        name
      }
    }
  }
`

export default {
  filters: {
    typeClass: val => val.split('.').pop()
  },
  components: {
    CardTitle,
    SchematicFlow
  },
  props: {
    loading: {
      type: Boolean,
      required: false,
      default: () => false
    },
    taskRun: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      expanded: true,
      showCards: true,
      task: null,
      tasks: []
    }
  },
  computed: {
    ...mapGetters('user', ['timezone']),
    subtitle() {
      return `${this.taskRun?.task?.upstream_edges?.length} Upstream • ${this.taskRun?.task?.downstream_edges?.length} Downstream`
    },
    query() {
      if (!this.taskRun) return
      let queryString = ''

      if (this.taskRun.task.upstream_edges.length) {
        const upstream = this.taskRun.task.upstream_edges.reduce(
          (string, edge, i) => {
            string += `
          upstream_task_run_${i}: task_run(where: { flow_run_id: { _eq: "${this.taskRun?.flow_run?.id}" }, task_id: { _eq: "${edge?.upstream_task?.id}" }, map_index: { _in: [ -1, ${this.taskRun?.map_index} ] } }) {
            ${taskRunFields}
          }
        `
            return string
          },
          ''
        )
        queryString += upstream
      }

      if (this.taskRun.task.downstream_edges.length) {
        const downstream = this.taskRun.task.downstream_edges.reduce(
          (string, edge, i) => {
            string += `
          downstream_task_run_${i}: task_run(where: { flow_run_id: { _eq: "${this.taskRun?.flow_run?.id}" }, task_id: { _eq: "${edge?.downstream_task?.id}" }, map_index: { _in: [ -1, ${this.taskRun?.map_index} ] } }) {
            ${taskRunFields}
          }
        `
            return string
          },
          ''
        )
        queryString += downstream
      }

      return queryString == ''
        ? null
        : gql`
        query TaskRunDependencies {
          ${queryString}
        }
      `
    },
    modifiedTaskRun() {
      return {
        ...this.taskRun,
        flow_run_name: this.taskRun.flow_run.name,
        task: {
          ...this.taskRun.task,
          task_run_id: this.taskRun.id,
          name:
            this.taskRun.name ??
            this.taskRun.task.name +
              (this.taskRun.map_index > -1
                ? ` (${this.taskRun.map_index})`
                : '')
        }
      }
    }
  },
  watch: {},
  methods: {
    onIntersect([entry]) {
      this.$apollo.queries.taskRunDependencies.skip = !entry.isIntersecting
    }
  },
  apollo: {
    taskRunDependencies: {
      query() {
        return this.query
      },
      skip() {
        return (
          !this.taskRun?.task?.downstream_edges?.length &&
          !this.taskRun?.task?.upstream_edges?.length
        )
      },
      update(data) {
        const dependencies = Object.keys(data).map(key => {
          const task = data[key][0]

          // We filter these because the references don't exist on this subset of tasks
          task.task.upstream_edges = task.task.upstream_edges.filter(
            edge => this.taskRun.task.id == edge.upstream_task.id
          )

          task.task.downstream_edges = task.task.downstream_edges.filter(
            edge => this.taskRun.task.id == edge.downstream_task.id
          )
          return task
        })

        dependencies.forEach(d => {
          d.flow_run_name = this.taskRun.flow_run.name

          d.task.name =
            d.name ?? d.task.name + (d.map_index > -1 ? `(${d.map_index})` : '')
        })
        this.tasks = [this.modifiedTaskRun, ...dependencies]

        return data
      },
      pollInterval: 5000
    }
  }
}
</script>

<template>
  <v-card v-intersect="{ handler: onIntersect }" class="pa-2" tile>
    <CardTitle title="Dependencies" icon="share" :subtitle="subtitle">
      <div slot="action" class="d-flex align-end justify-center flex-column">
        <v-checkbox
          v-model="showCards"
          dense
          label="Show Cards"
          color="primary"
          class="my-0 mr-4"
          hide-details
        ></v-checkbox>
      </div>
    </CardTitle>

    <v-card-text class="full-height position-relative">
      <SchematicFlow
        v-if="!loading"
        :tasks="tasks"
        show-legend
        :show-cards="showCards"
      />
      <v-skeleton-loader v-else type="image" />
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.full-height {
  min-height: 67vh;
}
</style>
