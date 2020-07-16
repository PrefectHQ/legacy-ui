<script>
import CardTitle from '@/components/Card-Title'
import { mapGetters } from 'vuex'
import SchematicFlow from '@/components/Schematics/Schematic-Flow'

export default {
  filters: {
    typeClass: val => val.split('.').pop()
  },
  components: {
    CardTitle,
    SchematicFlow
  },
  props: {
    downstreamCount: {
      type: Number,
      required: false,
      default: () => null
    },
    flowRunId: {
      type: String,
      required: true
    },
    loading: {
      type: Boolean,
      required: false,
      default: () => false
    },
    taskIds: {
      type: Array,
      required: true
    },
    upstreamCount: {
      type: Number,
      required: false,
      default: () => null
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
      return `${this.upstreamCount} Upstream • ${this.downstreamCount} Downstream`
    }
  },
  watch: {},
  methods: {},
  apollo: {
    flowRun: {
      query: require('@/graphql/Schematics/flow-run.gql'),
      variables() {
        return {
          id: this.flowRunId
        }
      },
      skip() {
        return (
          !this.flowRunId ||
          (this.tasks?.length && this.flowRun.state !== 'Running')
          // Had to add the second portion here because this
          // query was running out of control for some reason
        )
      },
      update(data) {
        if (data.flow_run && data.flow_run.length) {
          let taskRuns = data.flow_run[0].task_runs.filter(tr =>
            this.taskIds.includes(tr.task.id)
          )

          taskRuns.forEach(tr => {
            tr.flow_run_name = data.flow_run[0].name
            tr.task.upstream_edges = tr.task.upstream_edges.filter(edge =>
              this.taskIds.includes(edge.upstream_task.id)
            )
            tr.task.downstream_edges = tr.task.downstream_edges.filter(edge =>
              this.taskIds.includes(edge.downstream_task.id)
            )
          })

          this.tasks = taskRuns
          return data.flow_run[0]
        } else {
          this.tasks = []
        }
      },
      pollInterval: 1000
    }
  }
}
</script>

<template>
  <v-card class="pa-2" tile>
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

.position-relative {
  position: relative;
}

.position-absolute {
  position: absolute;
}
</style>
