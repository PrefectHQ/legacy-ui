<script>
import { formatTime } from '@/mixins/formatTimeMixin'
import { parametersMixin } from '@/mixins/parametersMixin'
import Parameters from '@/components/Parameters'

export default {
  components: {
    Parameters
  },
  mixins: [formatTime, parametersMixin],
  props: {
    flow: {
      type: Object,
      required: true
    },
    flowGroup: {
      type: Object,
      default: () => {}
    }
  },
  data() {
    return {
      paramInfoOpen: false,
      copiedText: {},
      configDisplayFieldsMap: {
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
    runConfigDisplayFields() {
      if (!this.flow.run_config || !this.flow.run_config.type) return []

      return this.configDisplayFieldsMap[this.flow.run_config.type].filter(
        field => this.flow.run_config[field] != null
      )
    },
    filteredStorage() {
      if (!this.flow.storage) return {}

      const filtered = ['__version__', 'prefect_version', 'flows']

      return Object.keys(this.flow.storage)
        .filter(key => !filtered.includes(key))
        .reduce((obj, key) => ({ ...obj, [key]: this.flow.storage[key] }), {})
    },
    flows() {
      if (!this.flow.storage?.flows) return null

      return this.flow.storage.flows
    }
  },
  methods: {
    copyToClipboard(value) {
      this.copiedText = {}
      this.copiedText[value] = true
      navigator.clipboard.writeText(value)

      setTimeout(() => {
        this.copiedText = {}
        this.copiedText[value] = false
      }, 600)
    },
    clickAndCopyable(field) {
      return ['image_tag', 'image_name', 'registry_url'].includes(field)
    }
  }
}
</script>

<template
  ><v-list class="card-content">
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
            <v-col cols="6" class="text-right font-weight-bold text-truncate">
              <v-tooltip bottom>
                <template #activator="{ on }">
                  <span
                    class="cursor-pointer show-icon-hover-focus-only pa-2px"
                    role="button"
                    @click="copyToClipboard(flow.id)"
                    v-on="on"
                  >
                    <v-icon x-small class="mb-2px mr-2" tabindex="0">
                      {{ copiedText[flow.id] ? 'check' : 'file_copy' }}
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
            <v-col cols="6" class="text-right font-weight-bold text-truncate">
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
                        copiedText[flow.flow_group_id] ? 'check' : 'file_copy'
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
            <v-col cols="6" class="text-right font-weight-bold text-truncate">
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
            <v-col cols="6" class="text-right font-weight-bold text-truncate">
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
          <v-row v-for="(value, key) in filteredStorage" :key="key" no-gutters>
            <v-col cols="4">
              {{ key }}
            </v-col>
            <v-col cols="8" class="text-right font-weight-bold text-truncate">
              <v-tooltip v-if="clickAndCopyable(key)" bottom max-width="300">
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
                    <v-icon x-small class="mb-2px mr-2" tabindex="0">{{
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
                <p> Here you can see the default paramaters for your flow.</p
                ><p>
                  If you want to update your flow group's parameters, you can do
                  so on the parameters tab in
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
                <v-btn small text @click="paramInfoOpen = false">Close</v-btn>
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
</template>

<style lang="scss">
.card-content {
  max-height: 207px;
  overflow-y: auto;
}

.mb-2px {
  margin-bottom: 2px;
}

.pa-2px {
  padding: 2px;
}

.bg-gray-transition {
  background-color: var(--v-appBackground-base);
  transition: background-color 300ms;
}

.bg-white-transition {
  background-color: var(--v-appForeground-base);
  transition: background-color 300ms;
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
</style>
