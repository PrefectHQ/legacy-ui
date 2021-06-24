<script>
import { parametersMixin } from '@/mixins/parametersMixin.js'
import CardTitle from '@/components/Card-Title'
import ParametersForm from '@/components/ParametersForm'
import JsonInput from '@/components/CustomInputs/JsonInput'
import jsBeautify from 'js-beautify'

export default {
  components: { JsonInput, CardTitle, ParametersForm },
  mixins: [parametersMixin],
  data() {
    return {
      expandedPanelKeys: [],
      selectedParameter: null,
      editAll: false,
      paramsToReset: false
    }
  },
  computed: {
    containerClass() {
      return !this.defaultParameters ? ['py-5', 'text-center'] : []
    },
    parametersOptions() {
      const perFlowObjectArray = []
      const selectedFlowObj = this.selectedFlowParameters
      const arrayOfParams = Object.entries(
        JSON.parse(this.updatedParameters) || this.flowGroup?.default_parameters
      )
      for (const [key, value] of arrayOfParams) {
        let flowValue = selectedFlowObj ? selectedFlowObj[key] : null
        perFlowObjectArray.push({
          name: key,
          flowGroupVal: value,
          defaultVal: value,
          flowVal: flowValue
        })
      }
      this.diffBetweenFlowGroupAndFlow.forEach(flowOnlyKey => {
        let flowValue = selectedFlowObj ? selectedFlowObj[flowOnlyKey] : null
        perFlowObjectArray.push({
          name: flowOnlyKey,
          flowGroupVal: null,
          defaultVal: flowValue,
          flowVal: flowValue
        })
      })
      const sorted = perFlowObjectArray.sort((a, b) => {
        return a.name > b.name ? 1 : -1
      })
      return sorted
    }
  },
  watch: {
    editAll(val) {
      // Allows swapping to jsonInput
      if (val) {
        this.parameterInput = jsBeautify(this.parameterInput, {
          indent_size: 4,
          space_in_empty_paren: true,
          preserve_newlines: true,
          indent_empty_lines: true
        })

        // Use next tick to make sure the json input element exists
        this.$nextTick(() => {
          this.$refs['parameterRef'].validateJson()
        })
      }
    }
  },
  methods: {
    update(parameters) {
      this.updatedParameters = parameters
    },
    reset(index) {
      if (index || index === 0) {
        this.expandedPanelKeys = this.expandedPanelKeys.filter(
          element => element !== index
        )
      }
      this.editAll = false
    },
    checkSame(parameter) {
      const same =
        JSON.stringify(parameter.defaultVal) ===
        JSON.stringify(parameter.flowVal)
      if (!same) this.paramsToReset = true
      return same
    },
    defaultVal(param) {
      if (param.defaultVal === null) return 'None'
      return JSON.stringify(param.defaultVal)
    },
    individualOpenEdit(index) {
      if (this.expandedPanelKeys.includes(index)) {
        this.expandedPanelKeys = this.expandedPanelKeys.filter(
          element => element !== index
        )
        return
      } else {
        this.expandedPanelKeys.push(index)
        return
      }
    },
    switchVal(param) {
      try {
        const parameterInputObj = JSON.parse(this.parameterInput)
        delete parameterInputObj[param.name]
        this.parameterInput = JSON.stringify(parameterInputObj)
        this.setDefaultParams(true)
      } catch (error) {
        const errString = toString(error)
        this.setAlert({
          alertShow: true,
          alertMessage: errString,
          alertType: 'error'
        })
      }
    },
    async clearFlowGroupParameters() {
      this.loading = true
      this.parameterInput = JSON.stringify({})
      await this.setDefaultParams(true)
    },
    async setAll() {
      if (!this.validParameters()) {
        this.loading = false
        return
      }
      await this.setDefaultParams()
      this.reset()
    }
  }
}
</script>

<template>
  <v-card class="pa-2 mt-2" :loading="loading" outlined>
    <CardTitle title="Default Parameters" icon="perm_data_setting" />

    <v-card-text class="pl-12">
      <div class="text-body-1" style="max-width: 1000px;">
        You can override the default parameter values on your Flow at the Flow
        Group level. If provided, they take precedence over any default
        parameters set at flow registration, and apply to all versions of your
        Flow. Here you can set new flow group default parameters or reset them
        to the parameters you set at registration.
      </div>
      <v-row class="mt-4">
        <v-col cols="12" class="pt-0">
          <v-row>
            <v-col cols="12">
              <v-dialog v-model="editAll" max-width="700">
                <template #activator="{ onD }">
                  <v-tooltip bottom>
                    <template #activator="{ on }">
                      <div
                        class="pb-1 text-center"
                        :class="containerClass"
                        :style="{
                          display:
                            !defaultParameters || !defaultParameters.length
                              ? 'block'
                              : 'inline-block'
                        }"
                        v-on="on"
                      >
                        <v-btn
                          v-if="
                            !!defaultParameters && !!defaultParameters.length
                          "
                          color="primary"
                          :disabled="permissionsCheck"
                          @click="editAll = true"
                          v-on="onD"
                        >
                          <v-icon left>edit</v-icon>
                          <span>JSON Edit</span>
                        </v-btn>
                      </div>
                    </template>
                    <span v-if="permissionsCheck">
                      You don't have permission to create or edit parameters.
                    </span>
                    <span v-else>
                      Use JSON to edit parameters for this flow group.
                    </span>
                  </v-tooltip>
                  <div
                    v-if="!defaultParameters || !defaultParameters.length"
                    class="mt-8 text-body-1"
                  >
                    <span class="font-weight-bold">{{
                      selectedFlow.name
                    }}</span>
                    has no default parameters.
                  </div>
                </template>

                <v-card v-if="editAll" :loading="loading" tile class="pa-2">
                  <CardTitle title="Parameters" />

                  <v-card-text class="pl-12">
                    <JsonInput
                      ref="parameterRef"
                      v-model="parameterInput"
                      selected-type="json"
                      :new-parameter-input="newParameterInput"
                      :disabled="selectedFlow.archived"
                      data-cy="flow-group-parameter-input"
                      @input="errorInParameterInput = false"
                    ></JsonInput>
                  </v-card-text>
                  <v-card-actions>
                    <v-spacer />
                    <v-btn text @click="reset">
                      Cancel
                    </v-btn>
                    <v-btn color="primary" :loading="loading" @click="setAll">
                      Set Params
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-dialog>
              <v-tooltip v-if="!!paramsToReset" bottom>
                <template #activator="{ on }">
                  <v-btn
                    text
                    color="red"
                    v-on="on"
                    @click="clearFlowGroupParameters"
                  >
                    Reset all</v-btn
                  >
                </template>
                <span
                  >Reset all default parameters to defaults set at
                  registration</span
                >
              </v-tooltip>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
      <v-expansion-panels v-model="expandedPanelKeys" multiple>
        <v-expansion-panel
          v-for="(parameter, i) in parametersOptions"
          :key="i"
          height="90px"
        >
          <v-expansion-panel-header disable-icon-rotate>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title class="text-h6"
                  >{{ parameter.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  Default Value:
                  {{ defaultVal(parameter) }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
            <template #actions>
              <v-tooltip bottom>
                <template #activator="{ on }">
                  <div v-on="on">
                    <v-btn
                      text
                      :disabled="checkSame(parameter)"
                      @click.stop="switchVal(parameter)"
                    >
                      <v-icon small class="ml-0 mr-2">fa-undo</v-icon>
                    </v-btn>
                  </div>
                </template>
                <span>Reset to the parameters set at flow registration</span>
              </v-tooltip>
              <v-tooltip top>
                <template #activator="{ on, attrs }">
                  <div v-bind="attrs" v-on="on">
                    <v-btn icon @click.stop="individualOpenEdit(i)"
                      ><v-icon v-if="expandedPanelKeys.includes(i)"
                        >expand_less</v-icon
                      ><v-icon v-else>expand_more</v-icon>
                    </v-btn>
                  </div>
                </template>
                <span v-if="permissionsCheck">
                  You don't have permission to create or edit parameters.
                </span>
                <span v-else>
                  Edit this parameter.
                </span>
              </v-tooltip>
            </template>
          </v-expansion-panel-header>

          <v-expansion-panel-content>
            <ParametersForm
              :parameter="parameter"
              :flow-group="flowGroup"
              @cancel="reset(i)"
              @updated="update"
            />
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.align-tooltip {
  max-width: max-content;
}

.break {
  max-width: 800px !important;
}
</style>
