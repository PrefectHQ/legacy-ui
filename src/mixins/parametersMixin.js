import { mapGetters, mapActions } from 'vuex'
import jsBeautify from 'js-beautify'
import difference from 'lodash.difference'

const jsonFormatOptions = {
  indent_size: 2,
  space_in_empty_paren: true,
  preserve_newlines: false
}

export const parametersMixin = {
  props: {
    flowGroup: {
      required: true,
      type: Object
    }
  },
  data() {
    return {
      loading: false,
      flowParameters: [],
      newParameterInput: null,
      alertMessage: '',
      alertType: '',
      updatedParameters: null
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('license', ['hasPermission']),
    parameterInput: {
      get() {
        const sorted = Object.fromEntries(
          Object.entries(this.flowGroup.default_parameters).sort()
        )
        const paramString = JSON.stringify(sorted)
        return jsBeautify(paramString, jsonFormatOptions)
      },
      set(val) {
        this.newParameterInput = val
      }
    },
    optionalParameters() {
      return this.selectedFlow.parameters
        .filter(parameter => !parameter.required)
        .map(parameter => parameter.name)
    },
    requiredParameters() {
      return this.selectedFlow.parameters
        .filter(parameter => parameter.required)
        .map(parameter => parameter.name)
    },
    permissionsCheck() {
      return !this.hasPermission('update', 'run')
    },
    selectedFlow() {
      return this.flowGroup.flows.find(flow => !flow.archived)
    },
    flowGroupParameters() {
      const fgParamObjArray = []
      for (const [key, value] of Object.entries(
        this.flowGroup?.default_parameters
      )) {
        fgParamObjArray.push({ name: key, default: value })
      }
      return fgParamObjArray
    },
    selectedFlowParameters() {
      return this.selectedFlow.parameters.reduce((accum, currentParam) => {
        accum[currentParam.name] = currentParam.default
        return accum
      }, {})
    },
    diffBetweenFlowGroupAndFlow() {
      const fgParams =
        JSON.parse(this.updatedParameters) || this.flowGroup?.default_parameters
      const selectedFlowParams = this.selectedFlowParameters
      const diff = difference(
        Object.keys(selectedFlowParams),
        Object.keys(fgParams)
      )
      return diff
    },
    defaultParameters() {
      const fgParams = this.flowGroup?.default_parameters
      const selectedFlowParams = this.selectedFlowParameters
      this.diffBetweenFlowGroupAndFlow.forEach(
        differentKey =>
          (fgParams[differentKey] = selectedFlowParams[differentKey])
      )
      const paramifiedArray = []
      for (const [key, value] of Object.entries(fgParams)) {
        const required =
          this.selectedFlow?.parameters.filter(
            paramObj => paramObj.name == key && paramObj.required
          ).length > 0
        paramifiedArray.push({
          name: key,
          default: value,
          required: required
        })
      }
      const sorted = paramifiedArray.sort((a, b) => {
        return a.name > b.name ? 1 : -1
      })
      return sorted
    }
  },
  watch: {
    flowGroup() {
      this.updatedParameters = null
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    validParameters() {
      if (!this.$refs.parameterRef) {
        return true
      }

      if (!this.validateJsonInput()) {
        return false
      }

      const parameters = JSON.parse(
        this.newParameterInput || this.parameterInput
      )

      if (!this.validateAllRequiredParametersExist(parameters)) {
        return false
      }

      if (!this.validateNoExtraParametersExist(parameters)) {
        return false
      }

      return false
    },
    validateJsonInput() {
      const jsonValidationResult = Array.isArray(this.$refs.parameterRef)
        ? this.$refs.parameterRef[0].validateJson()
        : this.$refs.parameterRef.validateJson()

      if (['SyntaxError', 'MissingError'].includes(jsonValidationResult)) {
        this.setAlert({
          alertShow: true,
          alertMessage: {
            SyntaxError: `There is a syntax error in your flow parameters JSON.
            Please correct the error and try again.`,
            MissingError: 'Please enter your flow parameters as a JSON object.'
          }[jsonValidationResult],
          alertType: 'error'
        })

        return false
      }

      return true
    },
    validateAllRequiredParametersExist(parameters) {
      if (
        this.requiredParameters.some(
          requiredParameter => !parameters.hasOwnKey(requiredParameter)
        )
      ) {
        this.setAlert({
          alertShow: true,
          alertMessage: `There are required flow parameters missing in the JSON payload.
        Please specify values for the missing parameters.`,
          alertType: 'error'
        })

        return false
      }

      return true
    },
    validateNoExtraParametersExist(parameters) {
      const extraParameters = Object.keys(parameters).filter(
        parameter =>
          !this.requiredParameters.includes(parameter) &&
          !this.optionalParameters.includes(parameter)
      )

      if (extraParameters.length > 0) {
        this.setAlert({
          alertShow: true,
          alertMessage: `You have parameters which were not part of your original flow: ${extraParameters}. Please remove them to continue.`,
          alertType: 'error'
        })

        return false
      }

      return true
    },
    formatParameterInput() {
      this.parameterInput = jsBeautify(this.parameterInput, jsonFormatOptions)
    },
    async setDefaultParams(noValidateNeeded) {
      this.loading = true
      try {
        const valid = noValidateNeeded || this.validParameters()
        if (!valid) {
          this.loading = false
          return
        }
        const parametersToSet = this.newParameterInput || this.parameterInput
        const { data, errors } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/set-default-params.gql'),
          variables: {
            input: {
              flow_group_id: this.flowGroup.id,
              parameters:
                parametersToSet && parametersToSet.trim() !== ''
                  ? JSON.parse(parametersToSet)
                  : null
            }
          },
          errorPolicy: 'all'
        })
        if (data) {
          this.updatedParameters = parametersToSet
          this.alertMessage = 'Your flow group parameters have been updated.'
          this.alertType = 'success'
          this.$emit('updated', this.updatedParameters)
        }
        if (errors) {
          this.alertType = 'error'
          this.alertMessage = errors[0].message
        }
      } catch (err) {
        this.alertType = 'error'
        this.alertMessage =
          'There was a problem setting your parameters.  Please check the input.'
      } finally {
        if (this.alertMessage) {
          await this.setAlert({
            alertShow: true,
            alertMessage: this.alertMessage,
            alertType: this.alertType
          })
          this.loading = false
        }
      }
    }
  }
}
