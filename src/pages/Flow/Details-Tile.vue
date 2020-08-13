<script>
import CardTitle from '@/components/Card-Title'
import Label from '@/components/Label'
import Parameters from '@/components/Parameters'
import PrefectSchedule from '@/components/PrefectSchedule'
import { formatTime } from '@/mixins/formatTimeMixin'
import { mapActions } from 'vuex'

export default {
  filters: {
    typeClass: val => val.split('.').pop()
  },
  components: {
    CardTitle,
    Label,
    Parameters,
    PrefectSchedule
  },
  mixins: [formatTime],
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
    return {
      copiedText: {},
      tab: 'overview',
      //labels
      newLabel: '',
      labelMenuOpen: false,
      labelSearchInput: '',
      removingLabel: null,
      newLabels: null,
      disableRemove: false,
      disableAdd: false,
      valid: false,
      errorMessage: '',
      duplicateLabel: '',
      rules: {
        labelCheck: value => this.checkLabelInput(value) || this.errorMessage
      }
    }
  },
  computed: {
    filteredStorage() {
      if (!this.flow.storage) return {}

      const filtered = ['__version__', 'prefect_version', 'flows']

      return Object.keys(this.flow.storage)
        .filter(key => !filtered.includes(key))
        .reduce((obj, key) => {
          obj[key] = this.flow.storage[key]
          return obj
        }, {})
    },
    flows() {
      if (!this.flow.storage || !this.flow.storage.flows) return null
      return this.flow.storage.flows
    },
    labels: {
      get() {
        if (!this.flow.environment.labels && !this.flowGroup.labels) return
        const labels = this.flowGroup.labels
          ? this.flowGroup.labels.slice().sort()
          : this.flow.environment.labels.slice().sort()
        return labels
      },
      set() {
        return
      }
    },
    labelsFiltered() {
      if (
        !this.flow.environment.labels &&
        !this.flowGroup.labels &&
        !this.newLabels
      )
        return
      const labels = this.newLabels || this.labels
      if (!this.labelSearchInput) return labels
      return labels.filter(label => {
        return new RegExp(this.labelSearchInput.toLowerCase(0)).test(
          label.toLowerCase()
        )
      })
    },
    labelsOverflow() {
      const labels = this.newLabels || this.labels
      let counter = 0
      labels.forEach(label => (counter += label.length))
      return counter > 30 || labels.length > 2
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    checkLabelInput(val) {
      const labels = this.newLabels || this.labels
      if (labels.includes(val) && !this.disableAdd) {
        this.errorMessage = 'Duplicate label'
        this.duplicateLabel = val
        this.valid = false
        return false
      }
      this.duplicateLabel = ''
      this.valid = true
      return true
    },
    removeLabel(labelToRemove) {
      this.removingLabel = labelToRemove
      this.disableRemove = true
      const labels = this.newLabels || this.labels
      const updatedArray = labels.filter(label => {
        return labelToRemove != label
      })
      this.editLabels(updatedArray)
    },
    async addLabel() {
      if (!this.valid) return
      this.disableAdd = true
      const labelArray = this.newLabels || this.labels.slice()
      labelArray.push(this.newLabel)
      this.editLabels(labelArray)
    },
    async editLabels(newLabels) {
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/add-label.gql'),
          variables: {
            flowGroupId: this.flowGroup.id,
            labelArray: newLabels
          },
          errorPolicy: 'all'
        })
        if (data) {
          this.newLabels = newLabels
          this.resetLabels()
        } else {
          this.labelsError()
          this.resetLabels()
        }
      } catch (e) {
        this.labelsError()
        this.resetLabels()
      }
    },
    resetLabels() {
      this.removingLabel = false
      this.disableAdd = false
      this.newLabel = ''
      this.disableRemove = false
    },
    labelsError() {
      this.setAlert({
        alertShow: true,
        alertMessage:
          'There was a problem updating your labels.  Please try again.',
        alertType: 'error'
      })
    },
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
            class="subtitle-2 grey--text text--darken-2 caption position-absolute font-weight-medium"
            style="bottom: 2px;"
          >
            {{ `Version ${flow.version}` }}
          </div>
        </v-col>
      </v-row>

      <div slot="action" class="d-flex flex-column align-end">
        <v-btn
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'overview' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'overview' ? 'var(--v-primary-base)' : 'transparent'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = 'overview'"
        >
          Overview
          <v-icon small>calendar_view_day</v-icon>
        </v-btn>

        <v-btn
          depressed
          small
          tile
          icon
          class="button-transition w-100 d-flex justify-end"
          :color="tab == 'details' ? 'primary' : ''"
          :style="{
            'border-right': `3px solid ${
              tab == 'details' ? 'var(--v-primary-base)' : 'transparent'
            }`,
            'box-sizing': 'content-box',
            'min-width': '100px'
          }"
          @click="tab = 'details'"
        >
          Details
          <v-icon small>notes</v-icon>
        </v-btn>
      </div>
    </CardTitle>

    <v-card-text class="pl-12 pt-2 card-content">
      <v-fade-transition hide-on-leave>
        <div v-if="tab == 'overview'">
          <v-list-item dense class="px-0">
            <v-list-item-content>
              <v-list-item-subtitle class="caption">
                Created by
              </v-list-item-subtitle>
              <div class="subtitle-2">
                {{
                  flow.created_by
                    ? flow.created_by.username
                    : 'A nonexistent user'
                }}
              </div>
              <div class="caption">{{ formatTime(flow.created) }} </div>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="flow.core_version" dense class="px-0">
            <v-list-item-content>
              <v-list-item-subtitle class="caption">
                Prefect Core Version:
              </v-list-item-subtitle>
              <div class="subtitle-2">{{ flow.core_version }}</div>
            </v-list-item-content>
          </v-list-item>

          <v-list-item dense class="px-0">
            <v-list-item-content>
              <v-list-item-subtitle class="caption">
                Schedule
              </v-list-item-subtitle>
              <div class="subtitle-2">
                <PrefectSchedule
                  v-if="flow.schedule"
                  :schedule="flow.schedule"
                />
                <span v-else>None</span>
              </div>
            </v-list-item-content>
          </v-list-item>
          <v-list-item dense class="px-0">
            <v-list-item-content width="800px">
              <v-list-item-subtitle class="caption">
                Labels
              </v-list-item-subtitle>

              <v-menu
                v-if="labelsOverflow"
                v-model="labelMenuOpen"
                :close-on-content-click="false"
                offset-y
                max-width="300px"
              >
                <template v-slot:activator="{ on }">
                  <v-btn small color="primary" class="mt-1" depressed v-on="on">
                    Show labels ({{
                      newLabels ? newLabels.length : labels.length
                    }})
                    <v-icon>
                      {{ labelMenuOpen ? 'arrow_drop_up' : 'arrow_drop_down' }}
                    </v-icon>
                  </v-btn>
                </template>
                <v-card width="300" class="pa-2">
                  <v-text-field
                    v-model.lazy="labelSearchInput"
                    dense
                    placeholder="Search labels"
                    clearable
                    solo
                    flat
                    outlined
                    prepend-inner-icon="search"
                    hide-details
                    class="label-search pa-2"
                  ></v-text-field>
                  <v-card-text
                    v-if="labelsFiltered.length > 0"
                    class="max-h-300 overflow-y-scroll"
                  >
                    <Label
                      v-for="(label, i) in newLabels || labelsFiltered"
                      :key="i"
                      closable
                      :duplicate="duplicateLabel === label"
                      :loading="removingLabel === label"
                      :disabled="disableRemove"
                      class="mr-1 mb-1"
                      @remove="removeLabel"
                      >{{ label }}</Label
                    >
                    <v-text-field
                      v-model="newLabel"
                      :rules="[rules.labelCheck]"
                      color="primary"
                      clearable
                      class="mt-2, mr-2 width=100%"
                      :disabled="disableAdd"
                      @keyup.enter="addLabel"
                    >
                      <template v-slot:prepend>
                        <v-tooltip bottom>
                          <template v-slot:activator="{ on }">
                            <v-icon
                              small
                              :color="valid ? 'primary' : 'error'"
                              v-on="on"
                              >fa-plus</v-icon
                            >
                          </template>
                          Add a new label
                        </v-tooltip>
                      </template>
                    </v-text-field>
                  </v-card-text>
                  <v-card-text v-else class="max-h-300 overflow-y-scroll pa-6">
                    No labels found. Try expanding your search?
                  </v-card-text>
                </v-card>
              </v-menu>

              <div v-else>
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-text-field
                      v-model="newLabel"
                      dense
                      :rules="[rules.labelCheck]"
                      color="primary"
                      clearable
                      class="py-0 mr-2 scroll"
                      :disabled="disableAdd"
                      v-on="on"
                      @keyup.enter="addLabel"
                      ><template v-slot:prepend-inner>
                        <Label
                          v-for="(label, i) in newLabels || labelsFiltered"
                          :key="i"
                          closable
                          :duplicate="duplicateLabel === label"
                          :loading="removingLabel === label"
                          :disabled="disableRemove"
                          class="mr-1 mb-1"
                          @remove="removeLabel"
                          >{{ label }}</Label
                        >
                      </template>
                    </v-text-field>
                  </template>
                  Add a new label
                </v-tooltip>
              </div>
            </v-list-item-content>
          </v-list-item>
        </div>
      </v-fade-transition>

      <v-fade-transition hide-on-leave>
        <div v-if="tab == 'details'">
          <v-list-item dense class="px-0">
            <v-list-item-content>
              <v-list-item-subtitle class="grey--text text--darken-3">
                General
              </v-list-item-subtitle>
              <v-divider style="max-width: 50%;" />
              <v-list-item-subtitle class="caption">
                <v-row no-gutters>
                  <v-col cols="6">
                    Flow Group
                  </v-col>
                  <v-col
                    cols="6"
                    class="text-right font-weight-bold text-truncate"
                  >
                    <v-tooltip bottom>
                      <template v-slot:activator="{ on }">
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
            </v-list-item-content>
          </v-list-item>

          <v-list-item dense class="px-0">
            <v-list-item-content>
              <v-list-item-subtitle class="grey--text text--darken-3">
                Environment
              </v-list-item-subtitle>
              <v-divider style="max-width: 50%;" />
              <v-list-item-subtitle class="caption">
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

          <v-list-item v-if="flow.storage" dense class="px-0 mt-2">
            <v-list-item-content>
              <v-list-item-subtitle class="grey--text text--darken-3">
                Storage
              </v-list-item-subtitle>
              <v-divider style="max-width: 50%;" />
              <v-list-item-subtitle class="caption">
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
                      <template v-slot:activator="{ on }">
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

          <v-list-item v-if="flows" dense class="px-0 mt-2">
            <v-list-item-content>
              <v-list-item-subtitle class="grey--text text--darken-3">
                Flow Locations
              </v-list-item-subtitle>
              <v-divider style="max-width: 50%;" />
              <v-list-item-subtitle class="caption">
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
            class="px-0"
          >
            <v-list-item-content>
              <v-list-item-subtitle class="grey--text text--darken-3">
                Parameters
              </v-list-item-subtitle>
              <v-divider style="max-width: 50%;" />
              <v-list-item-subtitle>
                <Parameters :parameters="flow.parameters"></Parameters>
              </v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </div>
      </v-fade-transition>
    </v-card-text>
  </v-card>
</template>

<style lang="scss">
.bg-gray-transition {
  background-color: #efefef;
  transition: background-color 300ms;
}

.bg-white-transition {
  background-color: #fff;
  transition: background-color 300ms;
}

.card-content {
  max-height: 254px;
  overflow-y: scroll;
}

.cursor-pointer {
  cursor: pointer;
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
