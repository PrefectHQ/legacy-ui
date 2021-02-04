<script>
/* eslint-disable vue/no-v-html */
import { mapGetters, mapActions } from 'vuex'

import DateTimeSelector from '@/components/RunConfig/DateTimeSelector'
import DictInput from '@/components/CustomInputs/DictInput'
import ExternalLink from '@/components/ExternalLink'
import MenuTooltip from '@/components/MenuTooltip'
import RunConfig from '@/components/RunConfig/RunConfig'
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
    MenuTooltip,
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
      stickyActions: true,

      // Parameters
      parameters: {},

      // Context
      context: {},

      // Schedule
      scheduledStartDateTime: null,

      // Flow run name input
      flowRunName: this.generateRandomName(),

      // ID of newly-created flow run
      flowRunId: null,

      runConfig: this.flow.run_config,

      // Loading state
      loading: false,

      showAdvanced: false,

      when: 'now'
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
  destroyed() {
    window.removeEventListener('scroll', this.handleScroll)
  },
  mounted() {
    this.parameters = this.selectedFlowParameters

    window.addEventListener('scroll', this.handleScroll)
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    async run() {
      try {
        this.loading = true
        if (!this.validParameters()) return
        if (!this.validContext()) return

        const { data, errors } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/create-flow-run.gql'),
          variables: {
            context: this.context,
            id: this.flow.id,
            flowRunName: this.flowRunName,
            parameters: this.parameters,
            scheduledStartTime: this.scheduledStartDateTime,
            runConfig: this.runConfig
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
  <v-card
    class="blue-grey--text text--darken-2 mt-2 run-container"
    flat
    outlined
  >
    <v-card-text class="run-body">
      <v-container fluid>
        <v-row class="my-2 pb-8" no-gutters>
          <v-col cols="12" md="6">
            <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
              <div class="text-h5">
                What do you want to call this run?
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="6">
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
                class="white ml-2 text-h5"
                hide-details
                outlined
                dense
              />
            </div>
          </v-col>
        </v-row>

        <v-row class="mt-2 py-8" no-gutters>
          <v-col cols="12" md="6" class="d-flex align-center">
            <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
              <div class="text-h5">
                When do you want to run it?
              </div>
            </div>
          </v-col>

          <v-col cols="12" md="6" class="d-flex align-center mt-4 mt-md-0">
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
              <DateTimeSelector v-model="scheduledStartDateTime" class="mt-8" />
            </v-col>
            <v-col cols="0" md="2" />
          </v-row>
        </v-fade-transition>

        <v-row class="my-2 py-8" no-gutters>
          <v-col cols="12" md="6">
            <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
              <div class="text-h5">
                Modify your parameters
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

          <v-col cols="12" md="6" class="mt-md-0 mt-sm-8 mt-xs-8">
            <DictInput v-model="parameters" :dict="selectedFlowParameters" />
          </v-col>
        </v-row>

        <v-row v-if="showAdvanced" class="my-2 py-8 row-divider" no-gutters>
          <v-col cols="12" md="6">
            <div class="py-0" :class="{ 'pr-24': $vuetify.breakpoint.mdAndUp }">
              <div class="text-h5">
                Modify run context
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

          <v-col cols="12" md="6" class="mt-md-0 mt-sm-8 mt-xs-8 text-body-1">
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

        <v-btn
          block
          depressed
          text
          class="text-none blue-grey--text mt-8 text--darken-2"
          @click="showAdvanced = !showAdvanced"
        >
          <div>
            <v-icon v-if="showAdvanced" small>
              expand_less
            </v-icon>
            <div>
              {{ showAdvanced ? 'Hide' : 'Show' }}
              <span class="font-weight-medium">advanced run configuration</span>
            </div>
            <v-icon v-if="!showAdvanced" small>
              expand_more
            </v-icon>
          </div>
        </v-btn>
      </v-container>
    </v-card-text>

    <!-- This is used to make sure the height of the document doesn't change during the scroll event handling -->
    <div
      class="run-actions placeholder"
      :class="{
        sticky: !stickyActions,
        lg: $vuetify.breakpoint.mdAndUp,
        sm: $vuetify.breakpoint.smAndDown
      }"
    />

    <v-card-actions
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

      <v-spacer></v-spacer>

      <v-btn
        class="text-none text-h5 px-4 run-tab-icon"
        :class="{ 'blue--icon': stickyActions }"
        :color="stickyActions ? 'white' : 'primary'"
        depressed
        x-large
        :loading="loading"
        @click="run"
      >
        Run
        <i class="fad fa-rocket ml-2" />
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style lang="scss" scoped>
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
  background-color: #fff;
  border-top: 1px solid #ddd;
  height: 86px;
  transition: all 150ms;
  width: 100%;

  &.placeholder {
    background-color: #fff !important;
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
      border-bottom: 1px solid #eee;
      bottom: 56px;
      height: 80px;
      z-index: 5;
    }
  }
}

.row-divider:not(:last-of-type) {
  position: relative;

  &::after {
    background-color: #ddd;
    bottom: 0;
    content: '';
    height: 1px;
    margin: auto;
    position: absolute;
    width: 100%;
  }
}
</style>

<style lang="scss">
.run-tab-icon {
  .svg-inline--fa {
    --fa-primary-color: #fff;
    --fa-secondary-color: #efefef;
    --fa-secondary-opacity: 0.5;
    transition: all 150ms linear;
  }

  &.blue--icon {
    .svg-inline--fa {
      --fa-primary-color: var(--v-primary-base);
      --fa-secondary-color: #ccc;
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
