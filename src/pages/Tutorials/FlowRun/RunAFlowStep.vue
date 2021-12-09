<script>
import { mapActions } from 'vuex'
import LogsCard from '@/components/LogsCard/LogsCard'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: { LogsCard },
  mixins: [formatTime],
  props: {
    flowId: {
      required: true,
      type: String
    },
    flowRunId: {
      default: '',
      type: String
    }
  },
  data() {
    return {
      flowRun: null,
      loading: false
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    displayError() {
      this.setAlert(
        {
          alertShow: true,
          alertMessage:
            'Failed to start flow run. Please wait a few moments and try again.',
          alertType: 'error'
        },
        5000
      )
    },
    async run() {
      try {
        this.loading = true
        const result = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-tutorial-flow-run.gql'),
          variables: {
            flowId: this.flowId
          },
          error(error) {
            this.displayError()
            throw error
          }
        })

        const flowRunId = result.data.create_flow_run.id
        this.$emit('flow-run-created', flowRunId)
      } catch (error) {
        this.displayError()
        throw error
      } finally {
        this.loading = false
      }
    },
    onIntersect([entry]) {
      this.$apollo.queries.flowRun.skip = !entry.isIntersecting
    }
  },
  apollo: {
    flowRun: {
      query: require('@/graphql/FirstRunWorkflow/flow-run.gql'),
      variables() {
        return {
          id: this.flowRunId
        }
      },
      skip() {
        return !this.flowRunId
      },
      pollInterval: 5000,
      update: data => data.flow_run_by_pk
    }
  }
}
</script>

<template>
  <div v-if="!flowRunId" v-intersect="{ handler: onIntersect }">
    <p>
      It's now time to run the demo flow using our locally-deployed agent!
    </p>
    <p>
      When you hit the "Run Demo Flow" button below, a new Flow Run will be
      created and placed in a "Scheduled" state. The agent you started will see
      this scheduled work and submit it for execution on your local machine via
      Docker. Note that your flow run will remain in a Submitted state as your
      Agent pulls the Docker image, which can take a moment depending on your
      connection.
    </p>
    <v-btn color="info" large class="mt-3" @click="run">
      Run Demo Flow
    </v-btn>
  </div>
  <div v-else>
    <p>
      Success! You've started your flow run; observe below as the run starts.
      Here are some
      <a
        class="link"
        href="https://docs.prefect.io/cloud/cloud_concepts/debug.html"
        target="_blank"
      >
        common tips
      </a>
      <v-icon small>
        open_in_new
      </v-icon>
      for debugging your flows (just in case this one doesn't succeed).
    </p>
    <div v-if="flowRun">
      <v-simple-table>
        <thead>
          <tr>
            <th class="text-left">
              Flow Run Name
            </th>
            <th class="text-left">
              State
            </th>
            <th class="text-left">
              Start Time
            </th>
            <th class="text-left">
              End Time
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{{ flowRun.name }}</td>
            <td>
              <v-icon :color="flowRun.state">
                brightness_1
              </v-icon>
              {{ flowRun.state }}
            </td>
            <td>{{ formatDateTime(flowRun.start_time) }}</td>
            <td>{{ formatDateTime(flowRun.end_time) }}</td>
          </tr>
        </tbody>
      </v-simple-table>

      <div
        style="
        max-width: 100%;
        overflow-x: scroll;"
      >
        <LogsCard
          class="mt-2 overflow-x-auto"
          entity="flow"
          :query="require('@/graphql/FirstRunWorkflow/flow-run.gql')"
          query-key="flow_run_by_pk"
          :variables="{ id: flowRunId }"
          :show-filter-description="false"
        />
      </div>
    </div>
    <div v-else class="d-flex justify-center" style="width: 100%;">
      <v-progress-circular indeterminate color="primary" />
    </div>
  </div>
</template>
