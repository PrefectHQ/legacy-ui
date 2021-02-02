<script>
/* eslint-disable vue/no-v-html */
import { mapGetters, mapActions } from 'vuex'

// import CardTitle from '@/components/Card-Title'
// import JsonInput from '@/components/CustomInputs/JsonInput'
// import Parameters from '@/components/Parameters'
// import PrefectSchedule from '@/components/PrefectSchedule'
import DateTimeSelector from '@/components/RunConfig/DateTimeSelector'
import DictInput from '@/components/CustomInputs/DictInput'
import ExternalLink from '@/components/ExternalLink'
import RunConfig from '@/components/RunConfig/RunConfig'
import { parametersMixin } from '@/mixins/parametersMixin.js'

export default {
  components: {
    // CardTitle,
    // JsonInput,
    // Parameters,
    // PrefectSchedule,
    DateTimeSelector,
    DictInput,
    ExternalLink,
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
      parameters: {},

      // Context
      contextInfoOpen: false,
      contextInput: null,
      errorInContextInput: false,

      // Schedule
      scheduledStartDateTime: null,

      // Flow run name input
      flowRunName: null,

      // ID of newly-created flow run
      flowRunId: null,

      // Loading state
      loading: false,

      when: 'future'
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
    },
    scheduledStartDateTime(val) {
      console.log(val)
    }
  },
  mounted() {
    this.parameters = this.selectedFlowParameters
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
  <v-container class="pa-0 blue-grey--text text--darken-2" fluid>
    <v-row class="my-2 py-8 row-divider" no-gutters>
      <v-col cols="12" md="6" class="pr-24">
        <div class="text-h5">
          Name
        </div>
      </v-col>

      <v-col cols="12" md="6" class="mt-md-0 mt-sm-8 mt-xs-8">
        <v-text-field
          v-model="flowRunName"
          placeholder="Default"
          class="white"
          label="Name"
          hide-details
          outlined
          dense
        />
      </v-col>
    </v-row>

    <v-row class="my-2 py-8 row-divider" no-gutters>
      <v-col cols="12" md="6" class="pr-24">
        <div class="text-h5">
          Scheduled Start
        </div>

        <div class="mt-2 text-body-2">
          <p>
            You can run this flow immediately or schedule it for some point in
            the future.
          </p>
          <p>
            Note that this will run this flow just <em>once</em>. To run your
            flow on a regular schedule, visit the schedules tab of the
            <router-link :to="{ name: 'flow', query: { tab: 'settings' } }">
              settings</router-link
            >
            and create a schedule. Alternatively, you can attach a schedule to
            your flow at registration time; for more information on schedules in
            your flow code, visit the
            <ExternalLink
              href="https://docs.prefect.io/core/concepts/schedules.html#schedules"
              >documentation</ExternalLink
            >.
          </p>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="mt-md-0 mt-sm-8 mt-xs-8">
        <div>
          <div class="mt-md-8">Run this flow...</div>
          <div>
            <v-btn
              depressed
              color="blue-grey"
              dark
              large
              active-class="primary font-weight-bold"
              class="text-none mr-2"
              :class="{ 'lighten-4': when == 'future' }"
              :input-value="when == 'immediately'"
              @click="when = 'immediately'"
              >immediately</v-btn
            >
            <v-btn
              depressed
              color="blue-grey"
              dark
              large
              active-class="primary font-weight-bold"
              class="text-none "
              :class="{ 'lighten-4': when == 'immediately' }"
              :input-value="when == 'future'"
              @click="when = 'future'"
              >at this point in the future...</v-btn
            >
          </div>
        </div>

        <v-fade-transition mode="out-in">
          <DateTimeSelector
            v-if="when == 'future'"
            v-model="scheduledStartDateTime"
            class="mt-8"
          />
        </v-fade-transition>
      </v-col>
    </v-row>

    <v-row class="my-2 py-8 row-divider" no-gutters>
      <v-col cols="12" md="6" class="pr-24">
        <div class="text-h5">
          Parameters
        </div>

        <div class="mt-2 text-body-2">
          <p>
            The
            <strong>run-time parameters</strong> for your run. To update your
            flow group's default parameters, visit the parameters tab of the
            <router-link :to="{ name: 'flow', query: { tab: 'settings' } }">
              settings</router-link
            >.
          </p>
          <p>
            Refer to the
            <ExternalLink
              href="https://docs.prefect.io/core/concepts/parameters.html#parameters"
              >documentation</ExternalLink
            >

            for more details on parameters.
          </p>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="mt-md-0 mt-sm-8 mt-xs-8">
        <DictInput v-model="parameters" :dict="selectedFlowParameters" />
      </v-col>
    </v-row>

    <v-row class="my-2 py-8 row-divider" no-gutters>
      <v-col cols="12" md="6" class="pr-24">
        <div class="text-h5">
          Context <span class="text-body-2 text--disabled">(Optional)</span>
        </div>

        <div class="mt-2 text-body-2">
          <p>
            The
            <strong>context</strong> for your run to share information between
            tasks without the need for explicit task arguments.
          </p>

          <p>
            Refer to the
            <ExternalLink
              href="https://docs.prefect.io/core/concepts/execution.html#context"
              >documentation</ExternalLink
            >
            for more details on context.
          </p>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="mt-md-0 mt-sm-8 mt-xs-8 text-body-1">
        <DictInput v-model="contextInput" />
      </v-col>
    </v-row>

    <div>
      <div class="text-h5">
        Run Configuration
        <span class="text-body-2 text--disabled">(Optional)</span>

        <div class="mt-2 text-body-2">
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
        </div>
      </div>

      <RunConfig :config="flow.run_config" />
    </div>
  </v-container>
</template>

<style lang="scss" scoped>
.pr-24 {
  padding-right: 124px;
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

.row-divider:not(:last-child) {
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
.tab-height-custom {
  .v-tabs-bar {
    height: 36px !important;
  }
}
</style>
