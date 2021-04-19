<script>
import SubPageNav from '@/layouts/SubPageNav'
import TileLayout from '@/layouts/TileLayout'
import AgentCard from '@/pages/Agents/AgentCard'
import AgentFlowRunHistory from '@/pages/Agents/AgentFlowRunHistory'
import AgentConfigCard from '@/pages/Agents/AgentConfigCard'
import MatchingLabels from '@/pages/Agents/MatchingLabels'

import { mapGetters } from 'vuex'

export default {
  components: {
    SubPageNav,
    TileLayout,
    AgentCard,
    AgentFlowRunHistory,
    AgentConfigCard,
    MatchingLabels
  },
  data() {
    return {
      tab: 'overview',
      tabs: [{ name: 'overview', target: 'overview' }]
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('agent', ['agent']),
    agentId() {
      return this.$route.params.id
    },
    agentDetails() {
      const agent = this.agent(this.agentId)
      return agent
    }
  }
}
</script>
<template>
  <v-sheet color="appBackground">
    <SubPageNav icon="pi-agent" page-type="Agent">
      <span slot="page-title">
        <span>
          {{ agentId }}
        </span>
        <!-- <span v-else>
          <v-skeleton-loader type="heading" tile></v-skeleton-loader>
        </span> -->
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
          <AgentCard slot="row-1-col-1-tile-1" :agent="agentDetails" />
          <AgentConfigCard slot="row-1-col-2-tile-1" :agent="agentDetails" />
          <MatchingLabels slot="row-1-col-3-tile-1" :agent="agentDetails" />
        </TileLayout>
      </v-tab-item>
    </v-tabs-items>
  </v-sheet>
</template>
