<script>
import SubPageNav from '@/layouts/SubPageNav'
import TileLayout from '@/layouts/TileLayout'
import AgentCard from '@/pages/Agents/AgentCard'

import { mapGetters } from 'vuex'

export default {
  components: {
    SubPageNav,
    TileLayout,
    AgentCard
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
      console.log('agent', agent)
      return agent
    }
  }
}
</script>
<template>
  <v-sheet color="appBackground">
    <SubPageNav icon="pi-agent" page-type="Agent">
      <span
        slot="page-title"
        :style="
          loading > 0
            ? {
                display: 'block',
                height: '28px',
                overflow: 'hidden'
              }
            : $vuetify.breakpoint.smAndDown && {
                display: 'inline'
              }
        "
      >
        <span v-if="loading === 0">
          {{ agentId }}
        </span>
        <span v-else>
          <v-skeleton-loader type="heading" tile></v-skeleton-loader>
        </span>
      </span>
      <span slot="tabs" style="width: 100%;">
        <NavTabBar :tabs="tabs" page="flow-run" />
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
          <AgentCard slot="row-1-col-1-tile-1" :agent="agentDetails" />
        </TileLayout>
      </v-tab-item>
    </v-tabs-items>
  </v-sheet>
</template>
