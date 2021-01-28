<script>
/* eslint-disable vue/no-v-html */
import { mapGetters, mapActions } from 'vuex'

// import CardTitle from '@/components/Card-Title'
// import JsonInput from '@/components/JsonInput'
// import Parameters from '@/components/Parameters'
// import PrefectSchedule from '@/components/PrefectSchedule'
// import DateTime from '@/components/DateTime'
import RunConfig from '@/components/RunConfig/RunConfig'
import { parametersMixin } from '@/mixins/parametersMixin.js'

export default {
  components: {
    // CardTitle,
    // JsonInput,
    // Parameters,
    // PrefectSchedule,
    // DateTime,
    RunConfig
  },
  mixins: [parametersMixin],
  props: {
    flow: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      // Parameters
      errorInParameterInput: false,
      paramInfoOpen: false,

      // Context
      contextInfoOpen: false,
      contextInput: '{}',
      errorInContextInput: false,

      // Schedule
      scheduledStartDateTime: null,

      // Flow run name input
      flowRunName: '',

      // ID of newly-created flow run
      flowRunId: null,

      // Loading state
      loading: false,
      codeMirrorLoading: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role'])
  },
  watch: {
    //Makes sure that codemirror updates if new defaults are set in the settings tab
    $route() {
      this.codeMirrorLoading = true
      setTimeout(() => {
        this.codeMirrorLoading = false
      }, 5)
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    async run() {
      try {
        this.loading = true
        if (!this.validParameters()) return
        if (!this.validContext()) return
        const parametersToSet = this.newParameterInput || this.parameterInput

        const { data, errors } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-flow-run.gql'),
          variables: {
            context:
              this.contextInput && this.contextInput.trim() !== ''
                ? JSON.parse(this.contextInput)
                : null,
            id: this.flow.id,
            flowRunName: this.flowRunName || null,
            parameters:
              parametersToSet && parametersToSet.trim() !== ''
                ? JSON.parse(parametersToSet)
                : null,
            scheduledStartTime: this.scheduledStartDateTime
          },
          errorPolicy: 'all'
        })
        if (data?.create_flow_run) {
          this.flowRunId = data.create_flow_run.id
          this.renderSuccessAlert(this.flowRunId)
          this.goToFlowRunPage()
        } else {
          this.showErrorAlert(errors[0].message)
        }
      } catch (error) {
        this.showErrorAlert(error)
      } finally {
        this.loading = false
      }
    },
    goToFlowRunPage() {
      this.$router.push({
        name: 'flow-run',
        params: { id: this.flowRunId, tenant: this.tenant?.slug }
      })
    },
    renderSuccessAlert(id) {
      this.setAlert({
        alertShow: true,
        alertMessage: 'Your flow run has been successfully scheduled.',
        alertType: 'success',
        alertLink: {
          name: 'flow-run',
          params: { id: id, tenant: this.tenant?.slug }
        }
      })
    },
    showErrorAlert(errorMessage) {
      this.setAlert({
        alertShow: true,
        alertMessage: errorMessage,
        alertType: 'error'
      })
    },
    validContext() {
      if (!this.$refs.contextRef) {
        return true
      }

      // Check JSON using the JsonInput component's validation
      const jsonValidationResult = this.$refs.contextRef.validateJson()

      if (jsonValidationResult === 'SyntaxError') {
        this.errorInContextInput = true
        this.showErrorAlert(`
          There is a syntax error in your flow context JSON.
          Please correct the error and try again.
        `)
        return false
      }

      if (jsonValidationResult === 'MissingError') {
        this.errorInContextInput = true
        this.showErrorAlert('Please enter your flow context as a JSON object.')
        return false
      }

      return true
    }
  }
}
</script>

<template>
  <div>
    <!-- <v-card tile> -->
    <!-- <v-card-text> -->
    <RunConfig :config="flow.run_config" />
    <!-- </v-card-text> -->
    <!-- </v-card> -->
    <!-- <v-layout
      align-content-start
      fill-height
      wrap
      :style="{ maxWidth: `${$vuetify.breakpoint.thresholds.md}px` }"
    >
      <v-flex xs12 sm4>
        <v-card tile class="mx-2 mt-1 mb-2">
          <CardTitle title="Run Details" icon="pi-flow-run" />

          <v-card-text v-if="flow.archived">
            <v-alert
              class="mt-4"
              border="left"
              colored-border
              elevation="2"
              type="warning"
            >
              This version is archived and cannot be run.
            </v-alert>
            <div class="py-4">
              For more information, check out the
              <router-link
                to="docs"
                target="_blank"
                href="https://docs.prefect.io/cloud/concepts/flows.html#flow-versions-and-archiving"
              >
                documentation on Flow Versions and Archiving
              </router-link>
              .
            </div>
          </v-card-text>
          <v-card-text v-else>
            <div class="mb-4">
              <v-text-field
                v-model="flowRunName"
                label="Flow run name"
                hint="You can leave this field blank if desired. Prefect will
                instead generate a random name for your flow run."
                persistent-hint
              ></v-text-field>
            </div>
            <DateTime
              v-model="scheduledStartDateTime"
              :text-field-props="{
                label: 'Scheduled Start Time',
                hint:
                  'Leave this field blank if you want to run the flow immediately.',
                persistentHint: true
              }"
              warning="Since this time is in the past, your flow will be scheduled to run immediately."
            />
            <div class="mb-6 mt-6">
              <v-subheader class="pl-0 subheader-height font-weight-bold">
                SCHEDULE
              </v-subheader>
              <div v-if="!flow.schedule">
                No Schedule
              </div>
              <div v-if="flow.schedule && flow.schedule.active">
                Schedule Active
              </div>
              <div v-else-if="flow.schedule && !flow.schedule.active">
                Schedule Inactive
              </div>
              <div v-if="flow.schedule && flow.schedule.active" class="mt-3">
                <v-icon>query_builder</v-icon>
                <PrefectSchedule
                  class="ml-1 body-1"
                  :schedule="flow.schedule.schedule"
                />
              </div>
            </div>
            <div class="pb-6">
              <div class="pa-0 pr-3 position-relative">
                <v-subheader class="pl-0 subheader-height font-weight-bold">
                  PARAMETERS
                </v-subheader>
              </div>
              <div v-if="defaultParameters && defaultParameters.length > 0">
                <Parameters :parameters="defaultParameters"></Parameters>
              </div>
              <div v-else>
                No Parameters
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-flex>
      <v-flex xs12 sm8>
        <v-card tile class="ma-2 flow-root">
          <CardTitle icon="perm_data_setting">
            <template slot="title">
              Parameters
              <v-menu
                v-model="paramInfoOpen"
                offset-y
                :close-on-content-click="false"
                open-on-hover
              >
                <template #activator="{ on }">
                  <div class="d-inline-block pr-4" v-on="on">
                    <v-icon
                      small
                      class="material-icons-outlined"
                      @focus="paramInfoOpen = true"
                      @blur="paramInfoOpen = false"
                    >
                      info
                    </v-icon>
                  </div>
                </template>
                <v-card tile class="pa-0" max-width="320">
                  <v-card-text class="pb-0">
                    <p>
                      Here you can provide
                      <strong>run-time parameters</strong> for a flow run. If
                      you want to update your flow group's default parameters,
                      you can do so on the parameters tab in
                      <router-link
                        :to="{ name: 'flow', query: { tab: 'settings' } }"
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

              <v-fade-transition>
                <v-icon
                  v-if="errorInParameterInput"
                  class="float-right mr-4"
                  color="error"
                >
                  error
                </v-icon>
              </v-fade-transition>
            </template>
          </CardTitle>
          <v-card-text class="px-2">
            <v-layout class="mb-3 position-relative" align-center>
              <div v-if="isReadOnlyUser" class="font-weight-black">
                Read-only users cannot run flows from the UI.
              </div>
              <div
                v-else-if="
                  !codeMirrorLoading &&
                    defaultParameters &&
                    defaultParameters.length > 0
                "
                class="width-100"
                :class="{
                  'ml-9': this.$vuetify.breakpoint.mdAndUp
                }"
              >
                <JsonInput
                  ref="parameterRef"
                  v-model="parameterInput"
                  :new-parameter-input="newParameterInput"
                  :disabled="flow.archived"
                  data-cy="flow-run-parameter-input"
                  @input="errorInParameterInput = false"
                ></JsonInput>
              </div>
              <div v-else class="px-2 ma-auto text-center">
                This flow has no parameters
                {{
                  flow.archived
                    ? 'but is archived and cannot be run.'
                    : '; Click "Run" to launch your flow!'
                }}
              </div>
            </v-layout>
            <v-layout class="mt-7 mb-2">
              <v-btn
                v-disable-read-only-user="flow.archived"
                class="vertical-button white--text ma-auto"
                color="primary"
                data-cy="submit-new-flow-run"
                fab
                large
                :loading="loading"
                elevation="2"
                @click="run"
              >
                <v-icon
                  class="mt-1 v-size--default"
                  :style="{
                    height: '24px',
                    'font-size': '24px',
                    'min-width': '24px'
                  }"
                >
                  fa-rocket
                </v-icon>
                <div>Run</div>
              </v-btn>
            </v-layout>
          </v-card-text>
        </v-card>
        <v-card tile class="mx-2 mt-6 flow-root">
          <CardTitle icon="list">
            <template slot="title">
              Context
              <v-menu
                v-model="contextInfoOpen"
                offset-y
                :close-on-content-click="false"
                open-on-hover
              >
                <template #activator="{ on }">
                  <div class="d-inline-block pr-4" v-on="on">
                    <v-icon
                      small
                      class="material-icons-outlined"
                      @focus="contextInfoOpen = true"
                      @blur="contextInfoOpen = false"
                    >
                      info
                    </v-icon>
                  </div>
                </template>
                <v-card tile class="pa-0" max-width="320">
                  <v-card-text class="pb-0">
                    <p>
                      (Optional) Provide
                      <strong>Context</strong> for your flow run to share
                      information between tasks without the need for explicit
                      task run arguments.
                    </p>
                    <p>
                      Refer to the
                      <a
                        href="https://docs.prefect.io/core/concepts/execution.html#context"
                        target="_blank"
                        rel="noopener noreferrer"
                        @click="contextInfoOpen = false"
                      >
                        documentation</a
                      >
                      <sup
                        ><v-icon x-small>
                          open_in_new
                        </v-icon></sup
                      >
                      for more details on Context.
                    </p>
                  </v-card-text>
                  <v-card-actions class="pt-0">
                    <v-spacer></v-spacer>
                    <v-btn small text @click="contextInfoOpen = false"
                      >Close</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-menu>
              <v-fade-transition>
                <v-icon
                  v-if="errorInContextInput"
                  class="float-right mr-4"
                  color="error"
                >
                  error
                </v-icon>
              </v-fade-transition>
            </template>
          </CardTitle>
          <v-card-text class="px-2">
            <v-layout class="mb-3 position-relative" align-center>
              <div v-if="isReadOnlyUser" class="font-weight-black">
                Read-only users cannot run flows from the UI.
              </div>
              <div v-else-if="flow.archived" class="px-2">
                This version is archived and cannot be run.
              </div>
              <div
                v-else
                class="width-100"
                :class="{
                  'ml-9': this.$vuetify.breakpoint.mdAndUp
                }"
              >
                <JsonInput
                  ref="contextRef"
                  v-model="contextInput"
                  height-auto
                  @input="errorInContextInput = false"
                ></JsonInput>
              </div>
            </v-layout>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout> -->
  </div>
</template>

<style lang="scss" scoped>
.flow-root {
  display: flow-root;
}

.subheader-height {
  height: 24px;
}

.width-100 {
  width: 100%;
}
</style>

<style lang="scss">
.tab-height-custom {
  .v-tabs-bar {
    height: 36px !important;
  }
}
</style>
