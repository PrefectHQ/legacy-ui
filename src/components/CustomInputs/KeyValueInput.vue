<template>
  <fieldset class="key-value-input">
    <v-text-field
      v-model="internalKey"
      label="Key"
      class="key-value-input__key-input"
      :error-messages="keyErrors"
      :disabled="readonly"
      outlined
      dense
    />
    <template v-if="showTypes && types && types.length > 0">
      <v-select
        v-model="selectedType"
        :items="types"
        label="Type"
        class="key-value-input__type-input"
        :error-messages="typeErrors"
        :disabled="types == null || types.length <= 1"
        outlined
        dense
      />
    </template>
    <component
      :is="valueComponent"
      v-model="internalValue"
      class="key-value-input__value-input"
    />
  </fieldset>
</template>

<script>
import { isIsoDateString } from '@/utils/dateTime'
import { types, isValidType } from '@/utils/types'
import InputTypes from '@/components/CustomInputs/KeyValueTypeInputs'

export default {
  name: 'KeyValueInput',
  props: {
    value: {
      type: Object,
      required: false,
      default: null
    },
    readonly: {
      type: Boolean,
      required: false,
      default: false
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
    }
  },
  data() {
    return {
      selectedType: null,
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
        this.$emit('input', { ...this.value, value: value })
      }
    },
    valueComponent() {
      switch (this.selectedType) {
        case 'null':
          return InputTypes.NullInput
        case 'boolean':
          return InputTypes.BooleanInput
        case 'number':
          return InputTypes.NumberInput
        case 'string':
          return InputTypes.StringInput
        case 'array':
          return InputTypes.ArrayInput
        case 'date':
          return InputTypes.DateInput
        case 'object':
          return InputTypes.ObjectInput
        default:
          return InputTypes.StringInput
      }
    },
    valueCanBeEmpty() {
      return this.isTypeAcceptable('null') || this.isTypeAcceptable('string')
    }
  },
  created() {
    this.trySetInitialSelectedType()
  },
  methods: {
    trySetInitialSelectedType() {
      if (this.types?.length === 1) {
        this.selectedType = this.types[0]
      }

      if (
        !this.showTypes ||
        this.internalKey == null ||
        this.selectedType != null
      ) {
        return
      }

      const type = this.discoverType(this.internalValue)

      if (this.isTypeAcceptable(type)) {
        this.selectedType = type
      }
    },
    isTypeAcceptable(type) {
      return this.types == null || this.types.includes(type)
    },
    discoverType(value) {
      if (value === null) {
        return 'null'
      }

      const type = typeof value
      if (type == 'object' && value instanceof Array) {
        return 'array'
      }
      if (type == 'object' && value instanceof Date) {
        return 'date'
      }
      if (type == 'string' && isIsoDateString(value)) {
        return 'date'
      }

      return type
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
      if (this.showTypes) {
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
      this.trySetInitialSelectedType()
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
  flex-basis: 0;
}

.key-value-input__value-input {
  flex-basis: 0 !important;
  flex-grow: 2 !important;
}
</style>
