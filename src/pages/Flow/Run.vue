<script>
/* eslint-disable vue/no-v-html */
import { mapGetters, mapActions } from 'vuex'

import DateTimeSelector from '@/components/RunConfig/DateTimeSelector'
import DictInput from '@/components/CustomInputs/DictInput'
import ExternalLink from '@/components/ExternalLink'
import ListInput from '@/components/CustomInputs/ListInput'
import MenuTooltip from '@/components/MenuTooltip'
import RunConfig from '@/components/RunConfig/RunConfig'
import { formatTime } from '@/mixins/formatTimeMixin.js'
import { parametersMixin } from '@/mixins/parametersMixin.js'
import throttle from 'lodash.throttle'
import { adjectives } from '@/components/RunConfig/adjectives'
import { animals } from '@/components/RunConfig/animals'

const adjectivesLength = adjectives.length
const animalsLength = animals.length

export default {
  components: {
    DateTimeSelector,
    DictInput,
    ExternalLink,
    ListInput,
    MenuTooltip,
    RunConfig
  },
  mixins: [formatTime, parametersMixin],
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
      stickyActions: false,

      // Logging Level
      loggingLevel: 'DEFAULT',
      loggingLevels: [
        { text: 'Default', value: 'DEFAULT' },
        { text: 'Debug', value: 'DEBUG' },
        { text: 'Info', value: 'INFO' },
        { text: 'Warn', value: 'WARN' },
        { text: 'Error', value: 'ERROR' },
        { text: 'Critical', value: 'CRITICAL' }
      ],

      // Parameters
      parameters: null,

      // Context
      context: {},
      labels: null,

      // Schedule
      scheduledStartDateTime: null,
      scheduledStartTimezone: null,

      // Flow run name input
      flowRunName: this.generateRandomName(),

      // ID of newly-created flow run
      flowRunId: null,

      runConfig: null,

      // Loading state
      loading: false,

      showAdvanced: false,
      showParameters: this.flow.parameters?.length > 0,
      parameterDefaults: this.flow.parameters,
      parameterJsonMode: false,

      when: 'now',
      runConfigs: {
        LocalRun: {
          label: 'Local',
          icon: 'fad fa-laptop-house'
        },
        UniversalRun: {
          label: 'Universal',
          icon: 'fad fa-globe'
        },
        DockerRun: {
          label: 'Docker',
          icon: 'fab fa-docker'
        },
        KubernetesRun: {
          label: 'Kubernetes',
          icon: 'pi-kubernetes'
        },
        ECSRun: {
          label: 'ECS',
          icon: 'fab fa-aws'
        }
      }
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant', 'role']),
    parameterItems() {
      return this.defaultParameters?.map(parameter => {
        return {
          disabled: true,
          key: parameter.name,
          value: parameter.default,
          required: parameter.required
        }
      })
    },
    contextModified() {
      if (!this.context) return false
      return Object.keys(this.context).filter(c => c !== '').length > 0
    },
    parametersModified() {
      if (!this.parameters) return false

      const entries = Object.entries(this.parameters)
      const defaults = Object.fromEntries(
        this.parameterDefaults?.map(entry => [entry.name, entry.default]) ?? []
      )

      const keysModified = entries.length !== this.parameterDefaults?.length
      const valuesModified = entries.some(
        entry => defaults[entry[0]] != entry[1]
      )

      return keysModified || valuesModified
    },
    runConfigTemplate() {
      return this.runConfig && this.runConfigs[this.runConfig.type]
    }
  },
  destroyed() {
    window.removeEventListener('scroll', this.handleScroll)
  },
  mounted() {
    this.parameters = this.defaultParameters.reduce((acc, param) => {
      acc[param.name] = param.default
      return acc
    }, {})
    this.runConfig = { ...this.flow.run_config }

    // run config > flow group > flow group run config > flow run config > flow > flow environment ?
    if (this.flowGroup.labels?.length > 0) {
      this.labels = this.flowGroup.labels
    } else if (this.flowGroup.run_config?.labels?.length > 0) {
      this.labels = this.flowGroup.run_config.labels
    } else if (this.flow.run_config?.labels?.length > 0) {
      this.labels = this.flow.run_config.labels
    } else if (this.flow.labels?.length > 0) {
      this.labels = this.flow.labels
    } else if (this.flow.environment?.labels?.length > 0) {
      this.labels = this.flow.environment.labels
    }

    window.addEventListener('scroll', this.handleScroll)
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    async run() {
      const parseObject = obj => {
        if (!obj) return
        Object.keys(obj).forEach(key => {
          try {
            if (typeof obj[key] == 'string') {
              obj[key] = JSON.parse(obj[key])
            }
          } catch {
            //
          }
        })
        return obj
      }

      try {
        this.loading = true
        // if the user has specified a logging level, pass it
        // to the run config as an env var
        this.overrideLoggingEnvironmentVariable()
        const { data, errors } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-flow-run.gql'),
          variables: {
            context: parseObject(this.context),
            id: this.flow.id,
            flowRunName: this.flowRunName,
            parameters: this.parameterJsonMode
              ? this.parameters
              : parseObject(this.parameters),
            scheduledStartTime: this.scheduledStartDateTime,
            runConfig: this.runConfig?.type
              ? { ...this.runConfig, labels: [] }
              : null,
            labels: this.labels
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
    handleToggleJsonEditor(val) {
      this.parameterJsonMode = val
    },
    handleLabelInput(val) {
      this.labels = val
    },
    generateRandomName() {
      const adjective = adjectives[Math.floor(Math.random() * adjectivesLength)]
      const animal = animals[Math.floor(Math.random() * animalsLength)]
      return adjective + '-' + animal
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
    overrideLoggingEnvironmentVariable() {
      if (this.loggingLevel !== 'DEFAULT') {
        this.runConfig.env = {
          ...this.runConfig.env,
          PREFECT__LOGGING__LEVEL: this.loggingLevel
        }
      }
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
    },
    handleScroll: throttle(
      function() {
        if (
          window.innerHeight + window.pageYOffset + 188 >=
          document.body.offsetHeight
        ) {
          this.stickyActions = false
        } else this.stickyActions = true
      },
      150,
      { leading: true, trailing: true }
    )
  }
}
</script>

<template>
  <v-card class="utilGrayDark--text mt-2 run-container" flat outlined>
    <v-card-text
      v-if="flow.archived"
      class="run-body d-flex align-center justify-center"
      style="min-height: 400px;"
    >
      <div class="text-h5 text-center blue-grey--text">
        <v-icon x-large>archive</v-icon>
        <div>
          This version of your flow is archived

          <MenuTooltip>
            <p>
              Archived versions of flows cannot be run.
            </p>

            <p>
              Refer to the
              <ExternalLink
                href="https://docs.prefect.io/orchestration/concepts/flows.html#flow-versions-and-archiving"
                >documentation</ExternalLink
              >
              for more details on versions and archiving.
            </p>
          </MenuTooltip>
        </div>
      </div>
    </v-card-text>

    <v-card-text v-else class="run-body">
      <v-container fluid>
        <v-row class="my-2 pb-8" no-gutters>
          <v-col cols="12" md="3">
            <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
              <div class="text-h5">
                Name
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="9">
            <div class=" mt-4 mt-md-0 d-flex align-center">
              <v-btn
                color="primary"
                fab
                depressed
                x-small
                title="Randomize run name"
                @click="flowRunName = generateRandomName()"
              >
                <v-icon>fad fa-random</v-icon>
              </v-btn>

              <v-text-field
                v-model="flowRunName"
                placeholder="name"
                class="ml-2 text-h5"
                hide-details
                outlined
                dense
              />
            </div>
          </v-col>
        </v-row>

        <v-row class="mt-2 py-8" no-gutters>
          <v-col cols="12" md="3" class="d-flex align-center">
            <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
              <div class="text-h5">
                Start
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="9" class="d-flex align-center mt-4 mt-md-0">
            <v-btn
              depressed
              color="blue-grey"
              dark
              large
              active-class="primary font-weight-bold"
              class="text-none mr-2 text-h6"
              :class="{ 'lighten-4': when == 'later' }"
              :input-value="when == 'now'"
              @click="
                when = 'now'
                scheduledStartDateTime = null
              "
              >now</v-btn
            >
            <v-btn
              depressed
              color="blue-grey"
              dark
              large
              active-class="primary font-weight-bold"
              class="text-none text-h6"
              :class="{ 'lighten-4': when == 'now' }"
              :input-value="when == 'later'"
              @click="when = 'later'"
              >later...</v-btn
            >
          </v-col>
        </v-row>

        <v-fade-transition mode="out-in">
          <v-row
            v-if="when == 'later'"
            class="pt-n8 pb-8 row-divider"
            no-gutters
          >
            <v-col cols="0" md="2" />
            <v-col cols="12" md="8">
              <DateTimeSelector
                v-model="scheduledStartDateTime"
                :timezone.sync="scheduledStartTimezone"
              />
            </v-col>
            <v-col cols="0" md="2" />
          </v-row>
        </v-fade-transition>

        <v-row v-if="showParameters" class="my-2 py-8" no-gutters>
          <v-col cols="12" md="3">
            <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
              <div class="text-h5">
                Inputs
                <MenuTooltip>
                  <p>
                    These are the parameters that are passed to your flow
                    through
                    <ExternalLink
                      href="https://docs.prefect.io/api/latest/core/parameters.html#parameter-2"
                      >Parameter tasks</ExternalLink
                    >. To update your flow group's default parameters, visit the
                    parameters tab of the
                    <router-link
                      :to="{ name: 'flow', query: { tab: 'settings' } }"
                    >
                      settings</router-link
                    >.
                  </p>
                </MenuTooltip>
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="9" class="mt-n4 mt-md-0 ">
            <DictInput
              v-model="parameters"
              :dict="parameterItems"
              disable-edit
              allow-reset
              @toggle-json-editor="handleToggleJsonEditor"
            />
          </v-col>
        </v-row>

        <v-row class="my-2 py-8 row-divider" no-gutters>
          <v-col cols="12" md="3">
            <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
              <div class="text-h5">
                Labels
                <MenuTooltip>
                  <p>
                    Labels are identifiers used by Prefect Agents for selecting
                    flow runs when polling for work. Labels that exist on both
                    the run and the agent will be submitted!
                  </p>

                  <p>
                    Refer to the
                    <ExternalLink
                      href="https://docs.prefect.io/orchestration/execution/overview.html#labels"
                      >documentation</ExternalLink
                    >
                    for more details on labels.
                  </p>
                </MenuTooltip>
                <span class="text-body-2 text--disabled ml-2">(Optional)</span>
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="9" class="mt-n4 mt-md-0 text-body-1">
            <ListInput
              label="Labels"
              :value="labels"
              @input="handleLabelInput"
            />
          </v-col>
        </v-row>

        <v-row v-if="showAdvanced" class="my-2 py-8 row-divider" no-gutters>
          <v-row class="my-2 py-8" no-gutters>
            <v-col cols="12" md="3">
              <div
                class="py-0"
                :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }"
              >
                <div class="text-h5">
                  Logging Level
                  <MenuTooltip>
                    <p>
                      Logging level for the flow run. If none is specified,
                      default agent logging level will be used.
                    </p>
                    <p>
                      This can also be controlled by providing an environment
                      variable, "PREFECT__LOGGING__LEVEL".
                    </p>
                    <p>
                      Any dropdown selection besides "Default" will override the
                      environment variable.
                    </p>
                    <p>
                      Please note this is only guaranteed to work for Agents
                      running Prefect Core 0.14.17 or later.
                    </p>
                  </MenuTooltip>
                </div>
              </div>
            </v-col>

            <v-col cols="12" md="9" class="mt-n4 mt-md-0">
              <v-select v-model="loggingLevel" outlined :items="loggingLevels">
                <template #item="{ item }">
                  <div>
                    <v-chip
                      class="ma-2 debuglevel cursor-pointer"
                      :class="item.text.toLowerCase()"
                    >
                      {{ item.text }}
                    </v-chip>
                  </div>
                </template>
                <template #selection="{ item }">
                  <div>
                    <v-chip
                      class="ma-2 debuglevel cursor-pointer"
                      :class="item.text.toLowerCase()"
                    >
                      {{ item.text }}
                    </v-chip>
                  </div>
                </template>
              </v-select>
            </v-col>
          </v-row>
        </v-row>

        <v-row v-if="showAdvanced" class="my-2 py-8 row-divider" no-gutters>
          <v-col cols="12" md="3">
            <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
              <div class="text-h5">
                Context
                <MenuTooltip>
                  <p>
                    The
                    <strong>context</strong> for your run to share information
                    between tasks without the need for explicit task arguments.
                  </p>

                  <p>
                    Refer to the
                    <ExternalLink
                      href="https://docs.prefect.io/core/concepts/execution.html#context"
                      >documentation</ExternalLink
                    >
                    for more details on context.
                  </p>
                </MenuTooltip>
                <span class="text-body-2 text--disabled ml-2">(Optional)</span>
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="9" class="mt-n4 mt-md-0 text-body-1">
            <DictInput v-model="context" />
          </v-col>
        </v-row>

        <v-row v-if="showAdvanced" class="mt-8" no-gutters>
          <div class="text-h5">
            Run Configuration
            <MenuTooltip>
              <p>
                The settings that determine where and how your flow should be
                executed. Each run config type corresponds to an agent; options
                displayed depend on the type of config selected.
              </p>

              <p>
                Refer to the
                <ExternalLink
                  href="https://docs.prefect.io/orchestration/flow_config/run_configs.html#labels"
                  >documentation</ExternalLink
                >
                for more details on run configs, including setting them at
                registration time.
              </p>
            </MenuTooltip>
            <span class="text-body-2 text--disabled ml-2">(Optional)</span>
          </div>

          <RunConfig v-model="runConfig" />
        </v-row>

        <div class="text-center">
          <v-btn
            depressed
            text
            outlined
            class="text-none utilGrayDark--text mt-8 py-6"
            @click="showAdvanced = !showAdvanced"
          >
            <div>
              <v-icon v-if="showAdvanced" small>
                expand_less
              </v-icon>
              <div class="font-weight-regular">
                {{ showAdvanced ? 'Hide' : 'Show' }}
                advanced run configuration
              </div>
              <v-icon v-if="!showAdvanced" small>
                expand_more
              </v-icon>
            </div>
          </v-btn>
        </div>
      </v-container>
    </v-card-text>

    <!-- This is used to make sure the height of the document doesn't change during the scroll event handling -->
    <div
      v-if="!flow.archived"
      class="run-actions placeholder"
      :class="{
        sticky: !stickyActions,
        lg: $vuetify.breakpoint.mdAndUp,
        sm: $vuetify.breakpoint.smAndDown
      }"
    />

    <v-card-actions
      v-if="!flow.archived"
      class="run-actions px-4 d-flex align-center"
      :class="{
        sticky: stickyActions,
        'px-12': stickyActions,
        lg: $vuetify.breakpoint.mdAndUp,
        sm: $vuetify.breakpoint.smAndDown
      }"
    >
      <div
        class="text-h4"
        :class="{
          'white--text': stickyActions
        }"
        style="max-width: 50%;"
      >
        <div
          class="text-body-2 text--disabled text-uppercase font-weight-medium"
          style="line-height: 0.8rem !important;"
        >
          Run
        </div>
        <div class="text-truncate">{{ flowRunName }}</div>
      </div>

      <v-divider
        class="mx-4 vertical-divider my-auto"
        vertical
        :style="{
          'border-color': stickyActions ? 'appForeground' : null
        }"
      />

      <div
        class="text-caption py-2 summary"
        :class="{ 'summary-background': stickyActions }"
      >
        <div
          :class="{
            'white--text': stickyActions
          }"
        >
          <span>When:</span>
          <span class="float-right font-weight-medium ml-2 accentGreen--text"
            >{{
              when == 'now'
                ? 'now'
                : formatDateTimeFromUTC(
                    scheduledStartDateTime,
                    scheduledStartTimezone
                  )
            }}
          </span>
        </div>

        <div
          v-if="showParameters"
          :class="{
            'white--text': stickyActions
          }"
        >
          <span>Parameters:</span>
          <span class="float-right font-weight-medium ml-2">
            <span v-if="parametersModified" class="accentGreen--text">
              modified
            </span>
            <span v-else>default</span>
          </span>
        </div>

        <div
          :class="{
            'white--text': stickyActions
          }"
        >
          <span>Context:</span>
          <span class="float-right font-weight-medium ml-2">
            <span v-if="contextModified" class="accentGreen--text">
              modified
            </span>
            <span v-else>default</span>
          </span>
        </div>

        <div
          :class="{
            'white--text': stickyActions
          }"
        >
          <span>RunConfig:</span>
          <span class="float-right font-weight-medium ml-2">
            <span v-if="runConfigTemplate" class="accentGreen--text">
              <span :key="runConfigTemplate.icon">
                <i :class="runConfigTemplate.icon" class="fa-sm pi-1x"> </i>
              </span>

              <span> {{ runConfigTemplate.label }}</span>
            </span>
            <span v-else>none</span>
          </span>
        </div>
      </div>

      <v-spacer></v-spacer>

      <v-btn
        class="text-none text-h5 px-4 run-tab-icon"
        :class="{ 'blue--icon': stickyActions }"
        :color="stickyActions ? 'appForeground' : 'primary'"
        depressed
        x-large
        :loading="loading"
        :disabled="flow.archived"
        @click="run"
      >
        Run
        <i class="fad fa-rocket ml-2" />
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
.vertical-divider {
  height: 70%;
  min-height: 0;
  opacity: 0.6;
}

.pr-24 {
  padding-right: 124px !important;
}

.flow-root {
  display: flow-root;
}

.subheader-height {
  height: 24px;
}

.width-100 {
  width: 100%;
}

.run-actions {
  background-color: var(--v-appForeground-base);
  border-top: 1px solid var(--v-utilGrayLight-base);
  height: 86px;
  transition: all 150ms;
  width: 100%;

  &.placeholder {
    background-color: var(--v-appForeground-base) !important;
    position: relative !important;
    transition: none;

    &.sticky {
      border-bottom: 0 !important;
      border-top: 0 !important;
      height: 0 !important;
    }
  }

  &.sticky {
    background-color: var(--v-primary-base);
    bottom: 0;
    left: 0;
    position: fixed;

    // Makes sure the actions are always z-index above the footer (which is z-index 3)
    z-index: 4;

    &.lg {
      height: 86px;
    }

    &.sm {
      border-bottom: 1px solid var(--v-utilGrayLight-base);
      bottom: 56px;
      height: 80px;
      z-index: 5;
    }
  }
}

.summary {
  display: grid;
  grid-auto-flow: column;
  grid-template-rows: repeat(2, 1fr);
  height: 60px;
  width: auto;

  div {
    min-width: 165px;
    padding: 0 16px;
  }

  div:nth-child(n + 3) {
    border-left: 1px solid rgba(255, 255, 255, 0.2);
  }

  &.summary-background {
    background-color: rgba(0, 0, 0, 0.2);
    border-radius: 2px;
    color: var(--v-appForeground-base);
  }
}

.row-divider:not(:last-of-type) {
  position: relative;

  &::after {
    background-color: var(--v-utilGrayLight-base);
    bottom: 0;
    content: '';
    height: 1px;
    margin: auto;
    position: absolute;
    width: 100%;
  }
}

.ma-2.debuglevel {
  color: var(--v-primaryLight-lighten5);
  font-weight: bold;
  justify-content: center;
  width: 75px;

  &.default {
    background: var(--v-success-lighten2);
  }

  &.error {
    background: var(--v-error-lighten2);
  }

  &.warn {
    background: var(--v-warning-lighten1);
  }

  &.info {
    background: var(--v-info-lighten2);
  }

  &.debug {
    background: var(--v-Looped-lighten2);
  }

  &.critical {
    background: var(--v-failRed-base);
  }
}
</style>

<style lang="scss">
.run-tab-icon {
  .svg-inline--fa {
    --fa-primary-color: var(--v-appForeground-base);
    --fa-secondary-color: var(--v-secondaryGrayLight-base);
    --fa-secondary-opacity: 0.5;
    transition: all 150ms linear;
  }

  &.blue--icon {
    .svg-inline--fa {
      --fa-primary-color: var(--v-primary-base);
      --fa-secondary-color: var(--v-utilGrayLight-base);
      --fa-secondary-opacity: 1;
    }
  }

  &:hover,
  &:focus {
    .svg-inline--fa {
      --fa-secondary-color: var(--v-accentPink-base);
      --fa-secondary-opacity: 1;
    }
  }
}
</style>
