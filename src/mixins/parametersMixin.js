import { mapGetters, mapActions } from 'vuex'
import { formatJson } from '@/utils/json'
import difference from 'lodash.difference'

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
      extraParameters: [],
      missingRequiredParameters: []
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('license', ['hasPermission']),
    parameterInput: {
      get() {
        return this.newParameterInput
      },
      set(val) {
        this.newParameterInput = val
      }
    },
    requiredParameters() {
      return this.selectedFlow.parameters.reduce((accum, currentParam) => {
        if (currentParam.required) accum.push(currentParam.name)
        return accum
      }, [])
    },
    permissionsCheck() {
      return !this.hasPermission('update', 'run')
    },
    selectedFlow() {
      return this.flow || this.flowGroup.flows.find(flow => !flow.archived)
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
      const fgParams = this.flowGroup?.default_parameters
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
  methods: {
    ...mapActions('alert', ['setAlert']),
    setParameterInput() {
      this.parameterInput = formatJson(this.flowGroup.default_parameters)
    },
    validateParameters() {
      this.extraParameters = []
      this.missingRequiredParameters = []
      if (!this.$refs.parameterRef) {
        return true
      }
      // Check JSON using the JsonInput component's validation
      const jsonValidationResult = Array.isArray(this.$refs.parameterRef)
        ? this.$refs.parameterRef[0].validateJson()
        : this.$refs.parameterRef.validateJson()
      if (jsonValidationResult === 'SyntaxError') {
        this.errorInParameterInput = true
        this.setAlert({
          alertShow: true,
          alertMessage: `There is a syntax error in your flow parameters JSON.
          Please correct the error and try again.`,
          alertType: 'error'
        })

        return false
      }
      if (jsonValidationResult === 'MissingError') {
        this.errorInParameterInput = true
        this.setAlert({
          alertShow: true,
          alertMessage: 'Please enter your flow parameters as a JSON object.',
          alertType: 'error'
        })
        return false
      }

      const parameters = JSON.parse(
        this.newParameterInput || this.parameterInput
      )
      // Collect any missing required parameters
      this.missingRequiredParameters = difference(
        this.requiredParameters,
        Object.keys(parameters)
      )
      // Collect any extra parameters.
      this.extraParameters = difference(
        Object.keys(parameters),
        this.selectedFlow.parameters.map(param => param.name)
      )
      if (
        this.missingRequiredParameters.length === 0 &&
        this.extraParameters.length === 0
      ) {
        return true
      }
      this.errorInParameterInput = true
      if (this.missingRequiredParameters.length > 0) {
        this.setAlert({
          alertShow: true,
          alertMessage: `There are required flow parameters missing in the JSON payload.
          Please specify values for the missing parameters.`,
          alertType: 'error'
        })
      } else {
        this.setAlert({
          alertShow: true,
          alertMessage: `You have parameters which were not part of your original flow: ${this.extraParameters}. Please remove them to continue.`,
          alertType: 'error'
        })
      }
      return false
    },
    async saveDefaultParams() {
      try {
        const { data, errors } = await this.$apollo.mutate({
          mutation: require('@/graphql/Mutations/set-default-params.gql'),
          variables: {
            input: {
              flow_group_id: this.flowGroup.id,
              parameters:
                this.parameterInput && this.parameterInput.trim() !== ''
                  ? JSON.parse(this.parameterInput)
                  : null
            }
          },
          errorPolicy: 'all'
        })
        if (data) {
          await this.showAlert(
            'Your flow group parameters have been updated.',
            'success'
          )
          this.$emit('updated', this.parameterInput)
        }
        if (errors) {
          await this.showAlert(errors[0].message, 'error')
        }
      } catch (err) {
        await this.showAlert(
          'There was a problem setting your parameters.  Please check the input.',
          'error'
        )
      }
    },
    async setDefaultParams() {
      this.loading = true

      if (!this.validateParameters()) {
        this.loading = false
        return
      }

      await this.saveDefaultParams()

      this.loading = false
    },
    async showAlert(alertMessage, alertType) {
      await this.setAlert({
        alertShow: true,
        alertMessage,
        alertType
      })
    }
  }
}
