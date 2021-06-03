<script>
import SubPageNav from '@/layouts/SubPageNav'
import TileLayout from '@/layouts/AgentLayout'
import AgentTile from '@/pages/Agents/AgentTile'
import AgentFlowRunHistory from '@/pages/Agents/AgentFlowRunHistory'
import AgentRunsInProgress from '@/pages/Dashboard/InProgress-Tile.vue'
import SubmittableRuns from '@/pages/Agents/SubmittableRuns'
import FlowRunTableTile from '@/pages/Agents/AgentFlowRunTable-Tile'

import { mapGetters, mapMutations, mapActions } from 'vuex'

export default {
  components: {
    SubPageNav,
    TileLayout,
    AgentTile,
    AgentFlowRunHistory,
    AgentRunsInProgress,
    SubmittableRuns,
    FlowRunTableTile
  },
  data() {
    return {
      tab: 'overview',
      tabs: [{ name: 'overview', target: 'overview' }],
      loading: false,
      showConfirmDialog: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('agent', ['sorting', 'sortedAgent']),
    agentId() {
      return this.$route.params.id
    },
    agentDetails() {
      const agent = this.sortedAgent(this.agentId)
      return agent
    },
    agentName() {
      return this.agentDetails?.name != 'agent'
        ? this.agentDetails?.name
        : this.agentDetails?.type
    }
  },
  watch: {
    tenant() {
      this.loading = true
      this.setRefetch(true)
      setTimeout(() => {
        this.$router.push({ name: 'agents' })
        this.loading = false
      }, 5000)
    }
  },
  methods: {
    ...mapMutations('agent', ['setAgents', 'setRefetch']),
    ...mapActions('alert', ['setAlert']),
    async deleteAgent() {
      try {
        this.showConfirmDialog = false
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Agent/delete-agent.gql'),
          variables: {
            agentId: this.agentDetails.id
          }
        })
        this.setRefetch(true)
        if (data.delete_agent?.success) this.$router.push({ name: 'agents' })
      } catch (error) {
        this.setAlert({
          alertShow: true,
          alertMessage: `${error}`,
          alertType: 'error'
        })
      }
    }
  }
}
</script>
<template>
  <v-sheet v-if="sorting || loading" color="appBackground">
    <v-progress-linear indeterminate color="primary"></v-progress-linear>
  </v-sheet>
  <v-sheet v-else color="appBackground">
    <SubPageNav icon="pi-agent" page-type="Agent" m>
      <span slot="page-title">
        <span>
          {{ agentName }}
        </span>
      </span>
      <span
        slot="page-actions"
        :class="{ 'mx-auto': $vuetify.breakpoint.xsOnly }"
      >
        <v-btn
          v-if="agentDetails.status === 'unhealthy'"
          text
          tile
          small
          color="error"
          class="vertical-button py-1"
          :title="'Remove agent'"
          @click="showConfirmDialog = true"
        >
          <v-icon>
            delete
          </v-icon>
          <div class="mb-1">Remove</div>
        </v-btn>

        <v-dialog v-model="showConfirmDialog" max-width="480">
          <v-card>
            <v-card-title class="word-break-normal">
              Are you sure you want to stop displaying this agent?
            </v-card-title>

            <v-card-text class="my-4 text-body-2">
              <strong>
                This action will not stop the agent process if it is still
                running in your infrastructure.</strong
              >
              It will only stop displaying the agent in Cloud.
            </v-card-text>

            <v-card-actions>
              <v-spacer></v-spacer>

              <v-btn text @click="showConfirmDialog = false">
                Cancel
              </v-btn>

              <v-btn color="error lighten-1" text @click="deleteAgent">
                Confirm
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </span>
    </SubPageNav>

    <v-tabs-items
      v-model="tab"
      class="px-6 mx-auto tabs-border-bottom tab-full-height"
      style="max-width: 1440px;"
      :style="{
        'padding-top': $vuetify.breakpoint.smOnly ? '30px' : '80px'
      }"
    >
      <v-tab-item
        class="pa-0"
        value="overview"
        transition="tab-fade"
        reverse-transition="tab-fade"
      >
        <TileLayout>
          <AgentFlowRunHistory slot="row-0" :agent="agentDetails" />
          <AgentTile
            slot="row-1-col-1-tile-1"
            show-all
            :raw-agent="agentDetails"
          />
          <SubmittableRuns
            slot="row-1-col-2-tile-1"
            :raw-agent="agentDetails"
          />
          <AgentRunsInProgress
            slot="row-1-col-3-tile-1"
            :agent-id="agentDetails.id"
            agent-runs
          />
          <FlowRunTableTile
            slot="row-2-col-1-row-2-tile-a"
            agent-runs
            :agent="agentDetails"
          />
        </TileLayout>
      </v-tab-item>
    </v-tabs-items>
  </v-sheet>
</template>
