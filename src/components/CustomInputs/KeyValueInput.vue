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
      @input="validateKey"
    />
    <template v-if="showTypes && hasTypes">
      <v-select
        data-public
        v-model="selectedType"
        :items="[emptyTypeOption, ...types]"
        label="Type"
        class="key-value-input__type-input"
        :disabled="singleTypeMode || readonlyType"
        outlined
        dense
        @input="handleTypeInput"
      />
    </template>
    <component
      :is="valueComponent"
      ref="valueInput"
      v-model="internalValue"
      class="key-value-input__value-input"
      v-bind="valueProps"
      @input="handleValueInput"
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
      keyErrors: []
    }
  },
  computed: {
    internalKey: {
      get() {
        return this.value?.key
      },
      set(value) {
        this.$emit('input', { ...this.value, key: value })
      }
    },
    internalValue: {
      get() {
        return this.value?.value
      },
      set(value) {
        this.$emit('input', { ...this.value, value: value })
      }
    },
    valueProps() {
      const props = { disabled: this.readonlyValue }

      if (this.valueComponent == InputTypes.JsonParsingInput) {
        props.types = this.types
      }

      return props
    },
    valueCanBeEmpty() {
      return this.isTypeAcceptable('None') || this.isTypeAcceptable('String')
    },
    showingTypes() {
      return this.showTypes && !this.singleTypeMode
    },
    hasTypes() {
      return this.types?.length > 0
    },
    singleTypeMode() {
      return this.types?.length === 1
    }
  },
  watch: {
    value: {
      deep: true,
      handler({ value }) {
        if (this.hasFocus()) {
          return
        }

        if (this.showingTypes) {
          this.trySettingType(value)
          this.trySettingValueComponent(this.selectedType)
        }
      }
    }
  },
  created() {
    this.checkSingleTypeMode()

    if (this.showingTypes) {
      this.trySettingType(this.internalValue)
      this.trySettingValueComponent(this.selectedType)
    }

    if (this.selectedType != null) {
      this.typeIsInferred = false
    }
  },
  methods: {
    checkSingleTypeMode() {
      if (this.singleTypeMode) {
        this.selectedType = this.types[0]
        this.valueComponent = this.getValueComponentForType(this.types[0])
      }
    },
    trySettingType(value) {
      const type = this.discoverType(value)

      this.selectedType = this.isTypeAcceptable(type) ? type : null
    },
    handleTypeInput(type) {
      this.typeIsInferred = type === null
      this.valueComponent = this.getValueComponentForType(type)
    },
    handleValueInput(value) {
      if (this.showingTypes && this.typeIsInferred) {
        this.trySettingType(value)
      }
    },
    trySettingValueComponent(type) {
      if (type != null) {
        this.valueComponent = this.getValueComponentForType(type)
      }
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
    hasFocus() {
      return this.$el.contains(document.activeElement)
    },
    getKeyErrors(value) {
      if (value == null || value.length == 0) {
        return ['Key is required']
      }

      return []
    },
    validateKey(value) {
      this.keyErrors = this.getKeyErrors(value)

      return this.keyErrors.length == 0
    },
    validateValue(value) {
      return this.$refs.valueInput.validate(value)
    },
    validate() {
      return (
        this.validateKey(this.internalKey) &&
        this.validateValue(this.internalValue)
      )
    },
    reset() {
      this.selectedType = null
      this.handleTypeInput(null)
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
