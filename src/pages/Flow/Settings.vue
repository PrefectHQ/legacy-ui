<script>
import CloudHooks from '@/pages/Flow/Settings/CloudHooks'
import GeneralSettings from '@/pages/Flow/Settings/General'
import Parameters from '@/pages/Flow/Settings/DefaultParameters'
import Schedules from '@/pages/Flow/Settings/Schedules'

export default {
  components: {
    CloudHooks,
    GeneralSettings,
    Parameters,
    Schedules
  },
  props: {
    flow: {
      required: true,
      type: Object
    },
    flowGroup: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      tab: 0
    }
  },
  computed: {
    isMobile() {
      return this.$vuetify.breakpoint.smAndDown
    }
  }
}
</script>

<template>
  <v-sheet color="appBackground">
    <v-tabs
      v-model="tab"
      fixed-tabs
      icons-and-text
      color="accentPink"
      tabs-border-bottom
      class="ml-n1 pt-2"
      style="width: calc(100% + 8px);"
    >
      <v-tab key="general" data-cy="flow-settings-general-tab">
        General
        <v-icon>settings</v-icon>
      </v-tab>

      <v-tab key="cloud-hooks" data-cy="flow-settings-cloud-hooks-tab">
        Cloud Hooks
        <v-icon>cloud</v-icon>
      </v-tab>

      <v-tab key="schedules" data-cy="flow-settings-schedules-tab">
        Schedules
        <v-icon>schedule</v-icon>
      </v-tab>

      <v-tab key="parameters" data-cy="flow-settings-parameters-tab">
        Parameters
        <v-icon>perm_data_setting</v-icon>
      </v-tab>
    </v-tabs>

    <v-tabs-items v-model="tab">
      <v-tab-item>
        <GeneralSettings :flow="flow" :flow-group="flowGroup" />
      </v-tab-item>

      <v-tab-item>
        <CloudHooks :flow="flow" :flow-group="flowGroup" />
      </v-tab-item>
      <v-tab-item>
        <Schedules v-if="tab == 2" :flow="flow" :flow-group="flowGroup" />
      </v-tab-item>
      <v-tab-item>
        <Parameters :flow-group="flowGroup" />
      </v-tab-item>
    </v-tabs-items>

    <v-bottom-navigation
      v-if="isMobile"
      class="bottom-sub-nav"
      horizontal
      fixed
      color="accentPink"
    >
      <v-btn :input-value="tab == 0" @click="tab = 0">
        General
        <v-icon>settings</v-icon>
      </v-btn>

      <v-btn :input-value="tab == 1" @click="tab = 1">
        Cloud Hooks
        <v-icon>cloud</v-icon>
      </v-btn>

      <v-btn :input-value="tab == 2" @click="tab = 2">
        Schedules
        <v-icon>schedule</v-icon>
      </v-btn>

      <v-btn :input-value="tab == 3" @click="tab = 3">
        Parameters
        <v-icon>format_list_numbered_rtl</v-icon>
      </v-btn>
    </v-bottom-navigation>
  </v-sheet>
</template>

<style lang="scss">
.bottom-sub-nav {
  bottom: 56px !important;
}
</style>
