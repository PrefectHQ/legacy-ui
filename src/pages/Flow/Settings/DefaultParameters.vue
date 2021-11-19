<script>
import { parametersMixin } from '@/mixins/parametersMixin.js'
import CardTitle from '@/components/Card-Title'
import CodeInput from '@/components/CustomInputs/CodeInput'
import { formatJson } from '@/utils/json'

export default {
  components: { CardTitle, CodeInput },
  mixins: [parametersMixin],
  computed: {
    originalParameters() {
      return formatJson(this.selectedFlowParameters)
    },
    parametersAreSetToDefault() {
      return this.originalParameters == this.parameterInput
    }
  },
  created() {
    this.setParameterInput()
  },
  methods: {
    async reset() {
      this.parameterInput = this.originalParameters
    },
    async save() {
      await this.setDefaultParams()
    }
  }
}
</script>

<template>
  <v-card class="default-parameters" :loading="loading" outlined>
    <CardTitle title="Default Parameters" icon="perm_data_setting" />

    <v-card-text class="default-parameters__container">
      <div class="default-parameters__description">
        You can override the default parameter values on your Flow at the Flow
        Group level. If provided, they take precedence over any default
        parameters set at flow registration, and apply to all versions of your
        Flow. Here you can set new flow group default parameters or reset them
        to the parameters you set at registration.
      </div>
      <div class="default-parameters__input">
        <code-input
          v-model="parameterInput"
          show-types
          readonly-key
          disable-add
          disable-remove
        />
      </div>
      <div v-if="permissionsCheck" class="default-parameters__actions">
        You don't have permission to create or edit parameters.
      </div>
      <div class="default-parameters__actions">
        <v-btn
          :disabled="permissionsCheck || parametersAreSetToDefault"
          text
          @click="reset"
        >
          Reset
        </v-btn>
        <v-btn
          :disabled="permissionsCheck"
          color="primary"
          :loading="loading"
          @click="save"
        >
          Set Params
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.default-parameters {
  margin-top: 16px;
}
.default-parameters__container {
  padding-left: 48px;
}

.default-parameters__description {
  max-width: 1000px;
  font-size: 1rem;
  line-height: 1.5rem;
}

.default-parameters__actions {
  display: flex;
  gap: 4px;
  justify-content: end;
  margin-bottom: 4px;
}
</style>
