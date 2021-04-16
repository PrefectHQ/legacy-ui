<script>
import SubPageNav from '@/layouts/SubPageNav'
import TileLayout from '@/layouts/TileLayout'
import AgentCard from '@/pages/Agents/AgentCard'

export default {
  components: {
    SubPageNav,
    TileLayout,
    AgentCard
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
          {{ tenant.name }}
        </span>
        <span v-else>
          <v-skeleton-loader type="heading" tile></v-skeleton-loader>
        </span>
      </span>

      <span
        slot="page-actions"
        :class="{ 'mx-auto': $vuetify.breakpoint.xsOnly }"
      ></span
    ></SubPageNav>
    <v-tabs-items
      v-if="flowGroup"
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
          <AgentCard show-all />
        </TileLayout>
      </v-tab-item>
    </v-tabs-items>
  </v-sheet>
</template>
