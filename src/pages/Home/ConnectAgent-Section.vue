<script>
import ExternalLink from '@/components/ExternalLink'
import { mapGetters } from 'vuex'

const AGENT_TYPES = [
  { type: 'DockerAgent', icon: 'fab fa-docker pa-1' },
  { type: 'ECSAgent', icon: 'fab fa-aws pa-1' },
  { type: 'FargateAgent', icon: 'fab fa-aws pa-1' },
  { type: 'KubernetesAgent', icon: 'pi-kubernetes' },
  { type: 'LocalAgent', icon: 'fad fa-laptop-house pa-1' },
  { type: 'NomadAgent', icon: '$nomad' }
]

export default {
  components: {
    ExternalLink
  },
  data() {
    return {
      agentToken: null,
      error: false,
      success: false,
      loadingKey: 0,
      token: null,
      tokenId: null
    }
  },
  computed: {
    ...mapGetters('api', ['isCloud', 'connected', 'isServer']),
    ...mapGetters('user', ['user'])
  },
  async mounted() {
    if (this.isCloud) {
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Tokens/create-api-key.gql'),
          variables: {
            name: `default-agent-${Date.now()}`,
            user_id: this.user?.id
          }
        })

        this.tokenId = data.create_api_key.id
        this.token = data.create_api_key.key
      } catch {
        //
      }
    }
  },
  async beforeDestroy() {
    // We try to delete the token if it wasn't used
    if (
      this.isCloud &&
      !this.agents?.some(agent => agent.token_id == this.tokenId) &&
      this.tokenId
    ) {
      try {
        await this.$apollo.mutate({
          mutation: require('@/graphql/Tokens/delete-token.gql'),
          variables: {
            id: this.tokenId
          }
        })
      } catch {
        //
      }
    }
  },
  methods: {
    async _refreshAgents() {
      this.$apollo.queries.agents.refetch()
    },
    agentIcon(type) {
      return AGENT_TYPES.find(a => a.type == type)?.icon
    }
  },
  apollo: {
    agents: {
      query() {
        return require('@/graphql/Agent/agents.js').default(this.isCloud)
      },
      pollInterval: 5000,
      loadingKey: 'loadingKey',
      skip() {
        return this.isServer
      },
      fetchPolicy: 'network-only',
      update: data =>
        data?.agent?.sort((a, b) => a.id.localeCompare(b.id)) || []
    }
  }
}
</script>

<template>
  <div class="appForeground">
    <div class="text-body-1">
      The Prefect Agent is a small entity created to orchestrate flow runs. The
      Agent works by querying the Prefect API for new or incomplete Flow Runs
      and allocating resources based on the Flow's configured deployment
      platform. You can read more about
      <ExternalLink
        href="https://docs.prefect.io/orchestration/agents/overview.html"
      >
        Agents
      </ExternalLink>
      in the docs.
    </div>

    <ol v-if="isServer" class="mt-6">
      <li value="1" class="text-h6 mt-6 mb-2">Set backend</li>
      <div class="text-body-1 mt-2">
        First, make sure Prefect is working against
        {{ isCloud ? 'Prefect Cloud' : 'your Prefect Server' }}
      </div>
      <div
        class="text-body-1 appBackground utilGrayDark--text rounded-sm pa-3 mt-4"
        style="border: 1px solid var(--v-utilGrayLight-base) !important;"
      >
        <div class="code-block">
          <span class="blue-grey--text text--lighten-1 user-select-none"
            >$
          </span>
          <span class="primary--text font-weight-medium">prefect</span>
          backend
          <span class="deepRed--text font-weight-medium">server</span>
        </div>
      </div>
    </ol>

    <ol class="mt-12">
      <li :value="isCloud ? 1 : 2" class="text-h6 mt-6 mb-2">Start an Agent</li>
      <div class="text-body-1 mt-2">
        For your Flows to run, you'll need to start an Agent process. There are
        many different types of Agents to choose from, each of which takes a
        number of arguments and flags; you can read more about them in the
        <ExternalLink
          href="https://docs.prefect.io/orchestration/agents/overview.html#usage"
        >
          docs </ExternalLink
        >. For example, the following CLI command starts a Local Agent on your
        local machine:
      </div>

      <div
        class="text-body-1 appBackground utilGrayDark--text rounded-sm pa-3 mt-4"
        style="border: 1px solid var(--v-utilGrayLight-base) !important;"
      >
        <div class="code-block">
          <span class="blue-grey--text text--lighten-1 user-select-none"
            >$
          </span>
          <span class="primary--text font-weight-medium">prefect</span>
          agent
          <span class="deepRed--text font-weight-medium">start</span>
          --name
          <span class="yellow--text text--darken-3 font-weight-medium"
            >"Default Agent"</span
          >
          <span v-if="token">
            --token
            <span class="yellow--text text--darken-3 font-weight-medium">{{
              token
            }}</span>
          </span>
        </div>
      </div>
    </ol>

    <ol v-if="isCloud" class="mt-12">
      <li value="2" class="text-h6 mt-6 mb-2">
        View polling Agents
      </li>
      <div>
        <v-btn class="my-4" color="primary" small @click="_refreshAgents">
          <v-icon left>refresh</v-icon>Refresh agents
        </v-btn>

        <span class="ml-2">
          <v-fade-transition mode="out-in">
            <span v-if="success">
              <v-icon v-if="success" key="success" color="green">
                check
              </v-icon>
              {{ success }}
            </span>
            <span v-else-if="error">
              <v-icon key="error" color="error">
                error
              </v-icon>
              {{ error }}
            </span>
          </v-fade-transition>
        </span>
      </div>

      <v-simple-table v-if="isCloud">
        <template #default>
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th width="50%">Labels</th>
            </tr>
          </thead>

          <tbody v-if="agents && agents.length > 0">
            <tr>
              <td
                colspan="3"
                class="pa-0"
                style="
                  border: unset !important;
                  height: auto !important;"
              >
                <v-progress-linear
                  :active="loadingKey > 0"
                  indeterminate
                  color="primary"
                />
              </td>
            </tr>
            <tr v-for="a in agents" :key="a.id">
              <td>
                <v-icon>
                  {{ a.type ? agentIcon(a.type) : 'fas fa-robot' }}
                </v-icon>
              </td>
              <td>{{ a.name }}</td>
              <td>
                <v-chip
                  v-for="label in a.labels"
                  :key="label"
                  x-small
                  label
                  outlined
                  class="mx-1"
                  color="primary"
                >
                  {{ label }}
                </v-chip>
              </td>
            </tr>
          </tbody>

          <tbody v-else>
            <tr>
              <td>No agents</td>
            </tr>
          </tbody>
        </template>
      </v-simple-table>
    </ol>
  </div>
</template>
