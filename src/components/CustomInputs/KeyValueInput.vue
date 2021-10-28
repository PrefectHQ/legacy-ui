<template>
  <fieldset class="key-value-input">
    <v-text-field
      v-model="internalKey"
      label="Key"
      class="key-value-input__key-input"
      :error-messages="keyErrors"
      :disabled="readonlyKey"
      outlined
      dense
    />
    <template v-if="showTypes && hasTypes">
      <v-select
        v-model="selectedType"
        :items="[emptyTypeOption, ...types]"
        label="Type"
        class="key-value-input__type-input"
        :error-messages="typeErrors"
        :disabled="singleTypeMode || readonlyType"
        outlined
        dense
        @change="handleSelectedTypeChange"
      />
    </template>
    <component
      :is="valueComponent"
      v-model="internalValue"
      :disabled="readonlyValue"
      class="key-value-input__value-input"
      v-bind="valueProps"
    />
  </fieldset>
</template>

<script>
import InputTypes from '@/components/CustomInputs/KeyValueTypeInputs'
import readonlyProps from '@/components/CustomInputs/readonlyProps'
import { isIsoDateString } from '@/utils/dateTime'
import { types, isValidType } from '@/utils/types'

export default {
  name: 'KeyValueInput',
  props: {
    value: {
      type: Object,
      required: false,
      default: null
    },
    showTypes: {
      type: Boolean,
      required: false,
      default: false
    },
    types: {
      type: Array,
      required: false,
      default: () => types,
      validator: value => value.every(isValidType)
    },
    ...readonlyProps
  },
  data() {
    return {
      selectedType: null,
      emptyTypeOption: { text: 'Auto', value: null },
      typeIsInferred: true,
      valueComponent: InputTypes.JsonParsingInput,
      keyErrors: [],
      typeErrors: []
    }
  },
  computed: {
    internalKey: {
      get() {
        return this.value?.key
      },
      set(value) {
        if (this.validateKey(value)) {
          this.$emit('input', { ...this.value, key: value })
        }
      }
    },
    internalValue: {
      get() {
        return this.value?.value
      },
      set(value) {
        if (this.shouldTrySettingType) {
          this.trySettingType(value)
        }

        this.$emit('input', { ...this.value, value: value })
      }
    },
    valueProps() {
      if (this.valueComponent == InputTypes.JsonParsingInput) {
        return { types: this.types }
      }

      return {}
    },
    valueCanBeEmpty() {
      return this.isTypeAcceptable('None') || this.isTypeAcceptable('String')
    },
    shouldTrySettingType() {
      return this.showTypes && this.typeIsInferred && !this.singleTypeMode
    },
    hasTypes() {
      return this.types?.length > 0
    },
    singleTypeMode() {
      return this.types?.length === 1
    }
  },
  created() {
    this.checkSingleTypeMode()

    if (this.shouldTrySettingType) {
      this.trySettingType(this.internalValue)
    }

    if (this.selectedType != null) {
      this.handleSelectedTypeChange(this.selectedType)
    }
  },
  methods: {
    checkSingleTypeMode() {
      if (this.singleTypeMode) {
        this.selectedType = this.types[0]
      }
    },
    trySettingType(value) {
      const type = this.discoverType(value)

      this.selectedType = this.isTypeAcceptable(type) ? type : null
    },
    handleSelectedTypeChange(type) {
      this.typeIsInferred = type === null
      this.valueComponent = this.getValueComponentForType(type)
    },
    getValueComponentForType(type) {
      switch (type) {
        case null:
          return InputTypes.JsonParsingInput
        case 'Boolean':
          return InputTypes.BooleanInput
        case 'Integer':
          return InputTypes.NumberInput
        case 'List':
          return InputTypes.ArrayInput
        case 'Date':
          return InputTypes.DateInput
        case 'Dictionary':
          return InputTypes.ObjectInput
        case 'None':
          return InputTypes.NullInput
        case 'String':
        default:
          return InputTypes.StringInput
      }
    },
    isTypeAcceptable(type) {
      if (type == 'None' && this.internalKey == null) {
        return false
      }

      return this.types == null || this.types.includes(type)
    },
    discoverType(value) {
      const type = typeof value

      switch (type) {
        case 'object':
          return this.discoverObjectType(value)
        case 'string':
          return this.discoverStringType(value)
        case 'number':
        case 'bigint':
          return 'Integer'
        case 'boolean':
          return 'Boolean'
      }

      return null
    },
    discoverStringType(value) {
      if (isIsoDateString(value)) {
        return 'Date'
      }

      return 'String'
    },
    discoverObjectType(value) {
      if (value === null) {
        return 'None'
      }

      if (value instanceof Array) {
        return 'List'
      }

      if (value instanceof Date) {
        return 'Date'
      }

      return 'Dictionary'
    },
    getKeyErrors(value) {
      if (value == null || value.length == 0) {
        return ['Key is required']
      }

      return []
    },
    getTypeErrors(value) {
      if (value == null) {
        return ['Type is required']
      }

      return []
    },
    validateKey(value) {
      this.keyErrors = this.getKeyErrors(value)

      return this.keyErrors.length == 0
    },
    validateType(value) {
      if (this.showTypes && this.hasTypes) {
        this.typeErrors = this.getTypeErrors(value)
      }

      return this.typeErrors.length == 0
    },
    validate() {
      const keyIsValid = this.validateKey(this.internalKey)
      const typeIsValid = this.validateType(this.selectedType)

      return keyIsValid && typeIsValid
    },
    reset() {
      this.selectedType = null
      this.handleSelectedTypeChange(null)
      this.checkSingleTypeMode()
      this.$emit('input', { value: null, key: null })
    }
  }
}
</script>

<style lang="scss">
.key-value-input {
  display: flex;
  gap: 24px;
  border: none;
}

.key-value-input__key-input {
  flex-basis: 0;
}

.key-value-input__type-input {
  width: 134px;
  flex-grow: 0;
}

.key-value-input__value-input {
  flex-basis: 0 !important;
  flex-grow: 2 !important;
}
</style>
