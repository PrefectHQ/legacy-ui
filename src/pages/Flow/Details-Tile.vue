<script>
import CardTitle from '@/components/Card-Title'
import LabelEdit from '@/components/LabelEdit'
import Parameters from '@/components/Parameters'
import PrefectSchedule from '@/components/PrefectSchedule'
import { formatTime } from '@/mixins/formatTimeMixin'
import { parametersMixin } from '@/mixins/parametersMixin'
import { mapActions, mapGetters } from 'vuex'

export default {
  filters: {
    typeClass: val => val.split('.').pop()
  },
  components: {
    CardTitle,
    LabelEdit,
    Parameters,
    PrefectSchedule
  },
  mixins: [formatTime, parametersMixin],
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
      tabs,
      paramInfoOpen: false,
      copiedText: {},
      typeFieldMap: {
        LocalRun: ['type', 'working_dir'],
        DockerRun: ['type', 'image'],
        KubernetesRun: [
          'type',
          'image',
          'job_template_path',
          'cpu_request',
          'cpu_limit',
          'memory_request',
          'memory_limit'
        ],
        ECSRun: ['type', 'image', 'task_definition_path', 'cpu', 'memory']
      }
    }
  },
  computed: {
    ...mapGetters('tenant', ['role']),
    filteredStorage() {
      if (!this.flow.storage) return {}

      const filtered = ['__version__', 'prefect_version', 'flows']

      return Object.keys(this.flow.storage)
        .filter(key => !filtered.includes(key))
        .reduce((obj, key) => ({ ...obj, [key]: this.flow.storage[key] }), {})
    },
    runConfigDisplayFields() {
      if (!this.flow.run_config?.type) return []

      return this.typeFieldMap[this.flow.run_config.type].filter(
        field => this.flow.run_config[field] != null
      )
    },
    flows() {
      if (!this.flow.storage?.flows) return null

      return this.flow.storage.flows
    },
    hasUser() {
      return this.flow?.created_by
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    clickAndCopyable(field) {
      return ['image_tag', 'image_name', 'registry_url'].includes(field)
    },
    copyToClipboard(value) {
      this.copiedText = {}
      this.copiedText[value] = true
      navigator.clipboard.writeText(value)

      setTimeout(() => {
        this.copiedText = {}
        this.copiedText[value] = false
      }, 600)
    }
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
            <v-list class="card-content">
              <v-list-item dense>
                <v-list-item-content>
                  <v-list-item-subtitle class="text-caption">
                    Created <span v-if="hasUser">by</span>
                  </v-list-item-subtitle>
                  <div v-if="hasUser" class="text-subtitle-2">
                    {{ flow.created_by.username }}
                  </div>
                  <div
                    class="text-caption"
                    :class="{ 'font-weight-bold': !hasUser }"
                  >
                    {{ formatTime(flow.created) }}
                  </div>
                </v-list-item-content>
              </v-list-item>

              <v-list-item v-if="flow.core_version" dense>
                <v-list-item-content>
                  <v-list-item-subtitle class="text-caption">
                    Prefect Core Version:
                  </v-list-item-subtitle>
                  <div class="text-subtitle-2">{{ flow.core_version }}</div>
                </v-list-item-content>
              </v-list-item>

              <v-list-item dense>
                <v-list-item-content>
                  <v-list-item-subtitle class="text-caption">
                    Schedule
                  </v-list-item-subtitle>
                  <div class="text-subtitle-2">
                    <PrefectSchedule
                      v-if="flow.schedule || flowGroup.schedule"
                      :schedule="
                        flow.schedule ? flow.schedule : flowGroup.schedule
                      "
                    />
                    <span v-else>None</span>
                  </div>
                </v-list-item-content>
              </v-list-item>

              <LabelEdit :flow="flow" :flow-group="flowGroup" />
            </v-list>
          </v-tab-item>
          <v-tab-item :key="tabs.details">
            <v-list class="card-content">
              <v-list-item dense>
                <v-list-item-content>
                  <v-list-item-subtitle class="utilGrayDark--text">
                    General
                  </v-list-item-subtitle>
                  <v-divider style="max-width: 50%;" />
                  <v-list-item-subtitle class="text-caption">
                    <v-row no-gutters>
                      <v-col cols="6">
                        Flow ID
                      </v-col>
                      <v-col
                        cols="6"
                        class="text-right font-weight-bold text-truncate"
                      >
                        <v-tooltip bottom>
                          <template #activator="{ on }">
                            <span
                              class="cursor-pointer show-icon-hover-focus-only pa-2px"
                              role="button"
                              @click="copyToClipboard(flow.id)"
                              v-on="on"
                            >
                              <v-icon x-small class="mb-2px mr-2" tabindex="0">
                                {{
                                  copiedText[flow.id] ? 'check' : 'file_copy'
                                }}
                              </v-icon>
                              {{ flow.id }}
                            </span>
                          </template>
                          <span>
                            {{ flow.id }}
                          </span>
                        </v-tooltip>
                      </v-col>
                    </v-row>
                  </v-list-item-subtitle>
                  <v-list-item-subtitle class="text-caption">
                    <v-row no-gutters>
                      <v-col cols="6">
                        Flow Group ID
                      </v-col>
                      <v-col
                        cols="6"
                        class="text-right font-weight-bold text-truncate"
                      >
                        <v-tooltip bottom>
                          <template #activator="{ on }">
                            <span
                              class="cursor-pointer show-icon-hover-focus-only pa-2px"
                              role="button"
                              @click="copyToClipboard(flow.flow_group_id)"
                              v-on="on"
                            >
                              <v-icon x-small class="mb-2px mr-2" tabindex="0">
                                {{
                                  copiedText[flow.flow_group_id]
                                    ? 'check'
                                    : 'file_copy'
                                }}
                              </v-icon>
                              {{ flow.flow_group_id }}
                            </span>
                          </template>
                          <span>
                            {{ flow.flow_group_id }}
                          </span>
                        </v-tooltip>
                      </v-col>
                    </v-row>
                  </v-list-item-subtitle>
                  <v-list-item-subtitle class="text-caption">
                    <v-row no-gutters>
                      <v-col cols="6">
                        Version Group ID
                      </v-col>
                      <v-col
                        cols="6"
                        class="text-right font-weight-bold text-truncate"
                      >
                        <v-tooltip bottom>
                          <template #activator="{ on }">
                            <span
                              class="cursor-pointer show-icon-hover-focus-only pa-2px"
                              role="button"
                              @click="copyToClipboard(flow.version_group_id)"
                              v-on="on"
                            >
                              <v-icon x-small class="mb-2px mr-2" tabindex="0">
                                {{
                                  copiedText[flow.version_group_id]
                                    ? 'check'
                                    : 'file_copy'
                                }}
                              </v-icon>
                              {{ flow.version_group_id }}
                            </span>
                          </template>
                          <span>
                            {{ flow.version_group_id }}
                          </span>
                        </v-tooltip>
                      </v-col>
                    </v-row>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-list-item dense>
                <v-list-item-content v-if="flow.run_config">
                  <v-list-item-subtitle class="utilGrayDark--text">
                    Run Config
                  </v-list-item-subtitle>
                  <v-divider style="max-width: 50%;" />
                  <v-list-item-subtitle class="text-caption">
                    <v-row
                      v-for="field in runConfigDisplayFields"
                      :key="field"
                      no-gutters
                    >
                      <v-col cols="6">
                        {{ field }}
                      </v-col>
                      <v-col
                        cols="6"
                        class="text-right font-weight-bold text-truncate"
                      >
                        {{ flow.run_config[field] }}
                      </v-col>
                    </v-row>
                  </v-list-item-subtitle>
                </v-list-item-content>
                <v-list-item-content v-else>
                  <v-list-item-subtitle class="utilGrayDark--text">
                    Environment
                  </v-list-item-subtitle>
                  <v-divider style="max-width: 50%;" />
                  <v-list-item-subtitle class="text-caption">
                    <v-row v-if="flow.environment.type" no-gutters>
                      <v-col cols="6">
                        Type
                      </v-col>
                      <v-col cols="6" class="text-right font-weight-bold">
                        {{ flow.environment.type }}
                      </v-col>
                    </v-row>

                    <v-row v-if="flow.environment.executor" no-gutters>
                      <v-col cols="6">
                        Executor
                      </v-col>
                      <v-col cols="6" class="text-right font-weight-bold">
                        {{ flow.environment.executor | typeClass }}
                      </v-col>
                    </v-row>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-list-item v-if="flow.storage" dense class="mt-2">
                <v-list-item-content>
                  <v-list-item-subtitle class="utilGrayDArk--text">
                    Storage
                  </v-list-item-subtitle>
                  <v-divider style="max-width: 50%;" />
                  <v-list-item-subtitle class="text-caption">
                    <v-row
                      v-for="(value, key) in filteredStorage"
                      :key="key"
                      no-gutters
                    >
                      <v-col cols="4">
                        {{ key }}
                      </v-col>
                      <v-col
                        cols="8"
                        class="text-right font-weight-bold text-truncate"
                      >
                        <v-tooltip
                          v-if="clickAndCopyable(key)"
                          bottom
                          max-width="300"
                        >
                          <template #activator="{ on }">
                            <span
                              class="cursor-pointer show-icon-hover-focus-only pa-2px"
                              :class="{
                                'bg-gray-transition': copiedText[value],
                                'bg-white-transition': !copiedText[value]
                              }"
                              role="button"
                              @click="copyToClipboard(value)"
                              v-on="on"
                            >
                              <v-icon
                                x-small
                                class="mb-2px mr-2"
                                tabindex="0"
                                >{{
                                  copiedText[value] ? 'check' : 'file_copy'
                                }}</v-icon
                              >{{ value }}
                            </span>
                          </template>
                          <span>
                            {{ value }}
                          </span>
                        </v-tooltip>
                        <span v-else>
                          {{ value }}
                        </span>
                      </v-col>
                    </v-row>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-list-item v-if="flows" dense class="mt-2">
                <v-list-item-content>
                  <v-list-item-subtitle class="utilGrayDark--text">
                    Flow Locations
                  </v-list-item-subtitle>
                  <v-divider style="max-width: 50%;" />
                  <v-list-item-subtitle class="text-caption">
                    <v-row
                      v-for="(value, key) in flows"
                      :key="key"
                      no-gutters
                      class="my-1"
                    >
                      <v-col cols="12">
                        {{ key }}
                      </v-col>
                      <v-col cols="12" class="font-weight-bold">
                        {{ value }}
                      </v-col>
                    </v-row>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>

              <v-list-item
                v-if="flow.parameters && flow.parameters.length > 0"
                dense
                two-line
              >
                <v-list-item-content>
                  <v-list-item-subtitle class="utilGrayDark--text">
                    Parameters
                    <v-menu
                      v-model="paramInfoOpen"
                      :close-on-content-click="false"
                      offset-y
                      open-on-hover
                    >
                      <template #activator="{ on }">
                        <v-btn text icon x-small v-on="on">
                          <v-icon>
                            info
                          </v-icon>
                        </v-btn>
                      </template>
                      <v-card tile class="pa-0" max-width="220">
                        <v-card-text class="pb-0">
                          <p>
                            Here you can see the default paramaters for your
                            flow.</p
                          ><p>
                            If you want to update your flow group's parameters,
                            you can do so on the parameters tab in
                            <router-link
                              :to="{ name: 'flow', query: { tab: 'settings' } }"
                              @click.native="paramInfoOpen = false"
                              >Flow Settings</router-link
                            >.
                          </p>
                          <p>
                            Refer to the
                            <a
                              href="https://docs.prefect.io/core/concepts/parameters.html#parameters"
                              target="_blank"
                              rel="noopener noreferrer"
                              @click="paramInfoOpen = false"
                            >
                              documentation</a
                            >
                            <sup
                              ><v-icon x-small>
                                open_in_new
                              </v-icon></sup
                            >
                            for more details on parameters.
                          </p>
                        </v-card-text>
                        <v-card-actions class="pt-0">
                          <v-spacer></v-spacer>
                          <v-btn small text @click="paramInfoOpen = false"
                            >Close</v-btn
                          >
                        </v-card-actions>
                      </v-card>
                    </v-menu>
                  </v-list-item-subtitle>
                  <v-divider style="max-width: 50%;" />
                  <v-list-item-subtitle>
                    <Parameters :parameters="defaultParameters"></Parameters>
                  </v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-tab-item>
        </v-tabs-items>
      </v-fade-transition>
    </v-card-text>
  </v-card>
</template>

<style lang="scss">
.bg-gray-transition {
  background-color: var(--v-appBackground-base);
  transition: background-color 300ms;
}
.bg-white-transition {
  background-color: var(--v-appForeground-base);
  transition: background-color 300ms;
}
.card-content {
  max-height: 207px;
  overflow-y: auto;
}
.label-search {
  border-radius: 0 !important;
  font-size: 0.85rem !important;
  .v-icon {
    font-size: 20px !important;
  }
}
.max-h-300 {
  max-height: 300px;
}
.mb-2px {
  margin-bottom: 2px;
}
.pa-2px {
  padding: 2px;
}
.show-icon-hover-focus-only {
  .v-icon {
    visibility: hidden;
  }
  &:hover,
  &:focus {
    .v-icon {
      visibility: visible;
    }
  }
}
.w-100 {
  width: 100% !important;
}
</style>
