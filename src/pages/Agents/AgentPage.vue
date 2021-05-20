<script>
import SubPageNav from '@/layouts/SubPageNav'
import TileLayout from '@/layouts/TileLayout'
import AgentTile from '@/pages/Agents/AgentTile'
import AgentFlowRunHistory from '@/pages/Agents/AgentFlowRunHistory'
import AgentConfigCard from '@/pages/Agents/AgentConfigCard'
import SubmittableRuns from '@/pages/Agents/SubmittableRuns'

import { mapGetters, mapMutations } from 'vuex'

export default {
  components: {
    SubPageNav,
    TileLayout,
    AgentTile,
    AgentFlowRunHistory,
    AgentConfigCard,
    SubmittableRuns
  },
  data() {
    return {
      tab: 'overview',
      tabs: [{ name: 'overview', target: 'overview' }],
      loading: false
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
    ...mapMutations('agent', ['setAgents', 'setRefetch'])
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
          {{ agentId }}
        </span>
      </span>
    </SubPageNav>

    <v-tabs-items
      v-model="tab"
      class="px-6 mx-auto tabs-border-bottom tab-full-height"
      style="max-width: 1440px;"
      :style="{
        'padding-top': $vuetify.breakpoint.smOnly ? '80px' : '130px'
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
          <AgentTile slot="row-1-col-1-tile-1" show-all :agent="agentDetails" />
          <SubmittableRuns slot="row-1-col-2-tile-1" :agent="agentDetails" />
          <AgentConfigCard slot="row-1-col-3-tile-1" :agent="agentDetails" />
        </TileLayout>
      </v-tab-item>
    </v-tabs-items>
  </v-sheet>
</template>
