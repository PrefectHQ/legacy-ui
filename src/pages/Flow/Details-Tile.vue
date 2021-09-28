<script>
import CardTitle from '@/components/Card-Title'
import { mapActions, mapGetters } from 'vuex'
import DetailsTileOverview from './Details-Tile-Overview.vue'
import DetailsTileDetails from './Details-Tile-Details.vue'

export default {
  filters: {
    typeClass: val => val.split('.').pop()
  },
  components: {
    CardTitle,
    DetailsTileOverview,
    DetailsTileDetails
  },
  props: {
    flow: {
      type: Object,
      default: () => {}
    },
    flowGroup: {
      type: Object,
      default: () => {}
    },
    fullHeight: {
      required: false,
      type: Boolean,
      default: () => false
    },
    lastFlowRun: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    const tabs = {
      overview: 0,
      details: 1
    }

    return {
      tab: tabs.overview,
      tabs
    }
  },
  computed: {
    ...mapGetters('tenant', ['role'])
  },
  methods: {
    ...mapActions('alert', ['setAlert'])
  }
}
</script>

<template>
  <v-card
    class="pa-2 pr-0"
    tile
    :style="{
      height: fullHeight ? '100%' : 'auto',
      'max-height': fullHeight ? '100%' : 'auto'
    }"
  >
    <v-system-bar
      :color="flow.archived ? 'grey' : lastFlowRun ? lastFlowRun.state : 'grey'"
      :height="5"
      absolute
    >
      <!-- We should include a state icon here when we've got those -->
      <!-- <v-icon>{{ flow.flow_runs[0].state }}</v-icon> -->
    </v-system-bar>
    <CardTitle :icon="flow.archived ? 'archive' : 'pi-flow'">
      <v-row slot="title" no-gutters class="d-flex align-center">
        <v-col cols="8">
          <div class="text-truncate pb-1">
            {{ flow.name }}
          </div>
          <div
            class="utilGrayDark--text text-caption position-absolute font-weight-medium"
            style="bottom: 2px;"
          >
            {{ `Version ${flow.version}` }}
          </div>
        </v-col>
      </v-row>
    </CardTitle>

    <v-tabs
      v-model="tab"
      tabs-border-bottom
      color="primary"
      class="flex-grow-0"
    >
      <v-tab :key="tabs.overview" data-cy="details-tile-overview">
        Overview
      </v-tab>
      <v-tab :key="tabs.details" data-cy="details-tile-detail">
        Details
      </v-tab>
    </v-tabs>

    <v-card-text class="pa-0">
      <v-fade-transition hide-on-leave>
        <v-tabs-items v-model="tab" class="flex-grow-1">
          <v-tab-item :key="tabs.overview">
            <details-tile-overview :flow="flow" :flow-group="flowGroup" />
          </v-tab-item>
          <v-tab-item :key="tabs.details">
            <details-tile-details :flow="flow" :flow-group="flowGroup" />
          </v-tab-item>
        </v-tabs-items>
      </v-fade-transition>
    </v-card-text>
  </v-card>
</template>
