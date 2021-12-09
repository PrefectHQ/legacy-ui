<script>
import CardTitle from '@/components/Card-Title'
import DurationSpan from '@/components/DurationSpan'
import SchematicFlow from '@/components/Schematics/Schematic-Flow'
import { mapGetters } from 'vuex'

export default {
  filters: {
    typeClass: val => val.split('.').pop()
  },
  components: {
    CardTitle,
    DurationSpan,
    SchematicFlow
  },
  data() {
    return {
      expanded: true,
      showCards: true,
      tasks: []
    }
  },
  computed: {
    ...mapGetters('user', ['timezone'])
  },
  watch: {},
  methods: {
    onIntersect([entry]) {
      this.$apollo.queries.flowRun.skip = !entry.isIntersecting
    }
  },
  apollo: {
    flowRun: {
      query: require('@/graphql/Schematics/flow-run.gql'),
      variables() {
        return {
          id: this.$route.params.id
        }
      },
      skip() {
        return !this.$route.params.id
      },
      update(data) {
        if (data?.flow_run_by_pk) {
          this.tasks = data.flow_run_by_pk.task_runs.map(tr => {
            return {
              ...tr,
              flow_run_name: data.flow_run_by_pk.name,
              task_run_id: tr.id
            }
          })
          return data.flow_run_by_pk
        } else {
          this.tasks = []
        }
      },
      pollInterval: 3000
    }
  }
}
</script>

<template>
  <v-card v-intersect="{ handler: onIntersect }" class="pa-2 mt-2" tile>
    <CardTitle title="Flow Run Schematic" icon="pi-schematic">
      <div v-if="flowRun" slot="badge" class="text-body-2">
        <span>
          Run State:
          <span
            class="font-weight-bold"
            :style="{ color: `var(--v-${flowRun.state}-base)` }"
          >
            {{ flowRun.state }}
          </span>
        </span>

        <span class="ml-4">
          Duration:
          <DurationSpan
            v-if="flowRun.start_time"
            class="font-weight-black"
            :start-time="flowRun.start_time"
            :end-time="flowRun.end_time"
          />
        </span>
      </div>
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
      <SchematicFlow :tasks="tasks" show-legend :show-cards="showCards" />
    </v-card-text>
  </v-card>
</template>

<style lang="scss" scoped>
.full-height {
  min-height: 67vh;
}

.vertical-divider {
  border-left: 0.5px solid rgba(0, 0, 0, 0.26);
  border-right: 0.5px solid rgba(0, 0, 0, 0.26);
  height: 75%;
}
</style>
