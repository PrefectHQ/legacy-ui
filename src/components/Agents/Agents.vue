<script>
import difference from 'lodash.difference'
import uniq from 'lodash.uniq'
import { mapGetters } from 'vuex'

import AgentCard from '@/components/Agents/AgentCard'
import moment from '@/utils/moment'

const STATUSES = ['healthy', 'stale', 'unhealthy']

export default {
  components: {
    AgentCard
  },
  data() {
    return {
      agents: null,
      filterMenuOpen: false,
      queryFailed: false,
      loading: 0,
      labelInput: [],
      showUnlabeledAgentsOnly: false,
      statusInput: STATUSES
    }
  },
  computed: {
    ...mapGetters('agent', ['staleThreshold', 'unhealthyThreshold']),
    ...mapGetters('tenant', ['tenant']),
    allLabels() {
      if (!this.agents) return []

      return this.agents.reduce(
        (accumLabels, currentAgent) => accumLabels.concat(currentAgent.labels),
        []
      )
    },
    isLoading() {
      return this.loading > 0
    },
    filteredAgents() {
      if (!this.agents) return []

      return this.agents.filter(agent => {
        if (this.showUnlabeledAgentsOnly) {
          return agent.labels.length === 0
        }

        if (!this.statusInput.includes(this.status(agent))) return false

        return difference(this.labelInput, agent.labels).length === 0
      })
    },
    filtersApplied() {
      return (
        this.labelInput.length > 0 ||
        this.statusInput.length < STATUSES.length ||
        this.showUnlabeledAgentsOnly
      )
    }
  },
  watch: {
    tenant(val) {
      this.labelInput = []
      this.queryFailed = false
      this.showUnlabeledAgentsOnly = false

      if (!val) return

      this.loading = 1

      setTimeout(async () => {
        await this.$apollo.queries.agents.refetch(), (this.loading = 0)
      }, 1000)
    }
  },
  methods: {
    handleLabelClick(lbl) {
      let label = lbl.trim()

      if (this.labelInput.includes(label)) {
        this.labelInput.splice(this.labelInput.indexOf(label), 1)
      } else {
        this.labelInput.push(label.trim())
        this.labelInput = uniq(this.labelInput)
      }
    },
    menuArrow() {
      const productSortSelect = this.$refs.agents
      if (productSortSelect.isMenuActive) {
        this.$refs.agents.isMenuActive = false
        productSortSelect.blur()
      } else {
        this.$refs.agents.isMenuActive = true
        productSortSelect.focus()
      }
    },
    resetFilter() {
      this.filterMenuOpen = false
      this.labelInput = []
      this.statusInput = STATUSES
      this.showUnlabeledAgentsOnly = false
    },
    status(agent) {
      if (agent.secondsSinceLastQuery < 60 * this.staleThreshold)
        return 'healthy'
      if (agent.secondsSinceLastQuery < 60 * this.unhealthyThreshold)
        return 'stale'

      return 'unhealthy'
    }
  },
  apollo: {
    agents: {
      query: require('@/graphql/Agent/agents.gql'),
      pollInterval: 5000,
      error() {
        this.queryFailed = true
      },
      loadingKey: 'loading',
      update: data => {
        if (!data.agents) return this.agents
        return data.agents
          .map(agent => ({
            ...agent,
            secondsSinceLastQuery: moment().diff(
              moment(agent.last_queried),
              'seconds'
            )
          }))
          .sort((agentA, agentB) => (agentA.id < agentB.id ? -1 : 1))
      }
    }
  }
}
</script>

<template>
  <div v-if="isLoading">
    <v-progress-linear indeterminate color="primary"></v-progress-linear>
  </div>

  <div v-else-if="!agents && queryFailed" class="subtitle-1 font-weight-light">
    <v-alert
      border="left"
      colored-border
      elevation="2"
      type="error"
      max-width="600"
    >
      <p>
        Something went wrong while trying to fetch agents.
      </p>

      <p class="mb-0">
        Please try refreshing your page. If this error persists, return to this
        page after a few minutes.
      </p>
    </v-alert>
  </div>

  <div v-else-if="agents && agents.length > 0">
    <v-menu
      v-model="filterMenuOpen"
      :close-on-content-click="false"
      bottom
      left
      offset-y
      transition="slide-y-transition"
    >
      <template v-slot:activator="{ on }">
        <v-btn
          class="vertical-button py-1 filter-button-position"
          color="#666"
          :class="{
            'md-and-down': $vuetify.breakpoint.mdAndDown,
            'md-and-up': $vuetify.breakpoint.mdAndUp
          }"
          text
          tile
          small
          v-on="on"
        >
          <v-icon>
            filter_list
          </v-icon>
          <div class="mb-1">Filter</div>
        </v-btn>
      </template>
      <v-card width="320">
        <v-card-text class="pb-6">
          <v-autocomplete
            ref="agents"
            v-model="labelInput"
            :items="allLabels"
            label="Filter agents by label"
            outlined
            multiple
            dense
            chips
            small-chips
            :disabled="showUnlabeledAgentsOnly || allLabels.length === 0"
            deletable-chips
            hide-no-data
            :menu-props="{
              closeOnContentClick: true,
              maxHeight: 300,
              transition: 'slide-y-transition'
            }"
            @click:append="menuArrow"
          ></v-autocomplete>
          <v-switch
            v-model="showUnlabeledAgentsOnly"
            class="ma-0 mt-1 label-switch-position"
            label="Only show agents with no labels"
            hide-details
          ></v-switch>
          <v-checkbox
            v-model="statusInput"
            hide-details
            label="Show healthy agents"
            value="healthy"
            color="success"
          ></v-checkbox>
          <v-checkbox
            v-model="statusInput"
            label="Show stale agents"
            :hint="
              `Stale agents have not queried for flows in the last ${
                staleThreshold === 1 ? 'minute' : `${staleThreshold} minutes`
              }.`
            "
            persistent-hint
            value="stale"
            color="warning"
          ></v-checkbox>
          <v-checkbox
            v-model="statusInput"
            label="Show unhealthy agents"
            :hint="
              `Unhealthy agents have not queried for flows in the last ${
                unhealthyThreshold === 1
                  ? 'minute'
                  : `${unhealthyThreshold} minutes`
              }.`
            "
            persistent-hint
            value="unhealthy"
            color="error"
          ></v-checkbox>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn text color="primary" @click="resetFilter">
            Reset
          </v-btn>
          <v-btn text @click="filterMenuOpen = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>

    <v-scroll-x-reverse-transition>
      <v-alert
        v-if="filtersApplied && !filterMenuOpen"
        class="filter-alert-position"
        border="left"
        colored-border
        dense
        elevation="2"
        type="info"
      >
        <span>
          Filters applied.
        </span>
        <v-btn
          tile
          text
          small
          color="info"
          class="ml-3 mr-0 my-0 pa-0"
          @click="filterMenuOpen = true"
          >View Filters</v-btn
        >
      </v-alert>
    </v-scroll-x-reverse-transition>

    <transition-group
      v-if="filteredAgents.length > 0"
      name="agents-list"
      tag="div"
      class="row"
    >
      <v-col
        v-for="agent in filteredAgents"
        :key="agent.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <AgentCard
          :agent="agent"
          :selected-labels="labelInput"
          @label-click="handleLabelClick"
        ></AgentCard>
      </v-col>
    </transition-group>

    <v-alert
      v-else
      border="left"
      colored-border
      elevation="2"
      type="warning"
      max-width="420"
      class="ma-3"
    >
      No agents found. Try expanding your search?
    </v-alert>
  </div>

  <div v-else class="subtitle-1 font-weight-light">
    <v-alert
      border="left"
      colored-border
      elevation="2"
      type="warning"
      max-width="600"
    >
      <p>
        You do not have any agents querying Prefect Cloud for flow runs.
      </p>

      <p class="mb-0">
        Refer to the Prefect Cloud documentation on
        <a
          href="https://docs.prefect.io/cloud/agent/overview.html"
          target="_blank"
          rel="noopener noreferrer"
          >agents</a
        >
        to understand their role in your infrastructure. You can also go through
        the
        <router-link class="link" :to="{ name: 'flow-run-tutorial' }">
          <u>Running a Flow</u>
        </router-link>
        and
        <router-link class="link" :to="{ name: 'universal-deploy-tutorial' }">
          <u>Universal Deploy</u>
        </router-link>
        tutorials for guidance on running agents in Cloud.
      </p>
    </v-alert>
  </div>
</template>

<style lang="scss" scoped>
.agents-list-move {
  transition: transform 300ms;
}

.agents-list-enter-active,
.agents-list-leave-active {
  transition: all 300ms;
}

.agents-list-leave-active {
  position: absolute;
}

.agents-list-enter,
.agents-list-leave-to {
  opacity: 0;
}

.filter-button-position {
  position: absolute;
  right: 8px;
  z-index: 1;

  &.md-and-down {
    top: -124px;
  }

  &.md-and-up {
    top: -72px;
  }
}

.filter-alert-position {
  position: absolute;
  right: 16px;
  z-index: 10;
}

.font-size-custom {
  font-size: 1.35em;
}

.label-switch-position {
  position: relative;
  top: -16px;
}
</style>
