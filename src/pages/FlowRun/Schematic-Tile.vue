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
  methods: {},
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
        if (data.flow_run && data.flow_run.length) {
          this.tasks = data.flow_run[0].task_runs.map(tr => {
            return { ...tr, flow_run_name: data.flow_run[0].name }
          })
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
  <v-card class="pa-2 mt-2" tile>
    <CardTitle title="Flow Run Schematic" icon="pi-schematic">
      <div v-if="flowRun" slot="badge" class="body-2">
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
          <span v-if="flowRun.duration" class="font-weight-black">
            {{ flowRun.duration | duration }}
          </span>
          <span v-else-if="flowRun.start_time" class="font-weight-black">
            <DurationSpan :start-time="flowRun.start_time" />
          </span>
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

.position-relative {
  position: relative;
}

.position-absolute {
  position: absolute;
}

.vertical-divider {
  border-left: 0.5px solid rgba(0, 0, 0, 0.26);
  border-right: 0.5px solid rgba(0, 0, 0, 0.26);
  height: 75%;
}
</style>
