<template>
  <div class="key-value-input">
    <v-text-field
      ref="keyInput"
      :value="internalKey"
      label="Key"
      class="key-value-input__key-input"
      :error-messages="keyErrors"
      :disabled="readonly"
      outlined
      dense
      @input="handleKeyInput"
    />
    <template v-if="showTypes && types && types.length > 0">
      <v-select
        v-model="internalType"
        :items="types"
        label="Type"
        class="key-value-input__type-input"
        :error-messages="typeErrors"
        :disabled="singleTypeMode"
        outlined
        dense
      />
    </template>
    <v-text-field
      ref="valueInput"
      :value="internalValue"
      label="Value"
      class="key-value-input__value-input"
      :error-messages="valueErrors"
      outlined
      dense
      @keydown.tab="$emit('tab', $event)"
      @input="handleValueInput"
    />
  </div>
</template>

<script>
import { parseJson, formatJson, isValidJson } from '@/utils/json'
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
      keyErrors: [],
      typeErrors: [],
      valueErrors: []
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
        const internalValue = this.value?.value

        if (typeof internalValue === 'object') {
          return formatJson(internalValue, 0)
        }

        return internalValue
      },
      set(value) {
        const converted = this.tryConvertingFromJson(value)

        this.$emit('input', { ...this.value, value: converted })
      }
    },
    internalType: {
      get() {
        if (this.singleTypeMode) {
          return this.types[0]
        }

        const type = this.tryDiscoveringType(this.internalValue)

        if (this.isTypeAcceptable(type)) {
          return type
        }

        return null
      },
      set(value) {
        const current = this.tryConvertingFromJson(this.internalValue)
        const converted = this.isTypeAcceptable(value)
          ? this.coerceType(current, value)
          : null

        this.$emit('input', { ...this.value, value: converted })
      }
    },
    singleTypeMode() {
      return this.types?.length === 1
    },
    valueCanBeEmpty() {
      return this.isTypeAcceptable('null') || this.isTypeAcceptable('string')
    }
  },
  methods: {
    handleKeyInput(value) {
      if (this.validateKey(value)) {
        this.internalKey = value
      }
    },
    handleValueInput(value) {
      if (this.validateValue(value)) {
        this.internalValue = value
      }
    },
    isTypeAcceptable(type) {
      return this.types == null || this.types.includes(type)
    },
    tryConvertingFromJson(value) {
      const converted = isValidJson(value) ? parseJson(value) : value

      return converted
    },
    tryDiscoveringType(value) {
      const converted = this.tryConvertingFromJson(value)

      return this.discoverType(converted)
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
    coerceType(value, type) {
      switch (type) {
        case 'null':
          return null
        case 'boolean':
          return Boolean(value)
        case 'number':
          return isNaN(value) ? 0 : Number(value)
        case 'string':
          return String(value)
        case 'array':
          return [value]
        case 'date':
          return new Date(value)
        case 'object':
          return { key: value }
      }
    },
    focus() {
      this.$refs.keyInput.focus()
      this.showErrors = false
    },
    isEmpty(value) {
      const json = formatJson(value)

      return json == null || json.length == 0
    },
    getAcceptableDefaultValue() {
      if (this.isTypeAcceptable('null')) {
        return null
      }

      if (this.isTypeAcceptable('string')) {
        return ''
      }
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
    getValueErrors(value) {
      if (this.isEmpty(value) && !this.valueCanBeEmpty) {
        return ['Value is required']
      }

      if (
        this.singleTypeMode &&
        this.tryDiscoveringType(value) != this.types[0]
      ) {
        return [`Value does not match expected type (${this.types[0]})`]
      }

      return []
    },
    validateKey(value) {
      this.keyErrors = this.getKeyErrors(value ?? this.internalKey)

      return this.keyErrors.length == 0
    },
    validateType(value) {
      this.typeErrors = this.getTypeErrors(value ?? this.internalType)

      return this.typeErrors.length == 0
    },
    validateValue(value) {
      this.valueErrors = this.getValueErrors(
        value ?? this.internalValue ?? this.getAcceptableDefaultValue()
      )

      return this.valueErrors.length == 0
    },
    validate() {
      this.showErrors = true

      this.validateKey()
      this.validateType()
      this.validateValue()

      return (
        this.keyErrors.length == 0 &&
        this.typeErrors.length == 0 &&
        this.valueErrors.length == 0
      )
    }
  }
}
</script>

<style lang="scss">
.key-value-input {
  display: flex;
  gap: 24px;
}

.key-value-input__key-input {
  flex-basis: 0;
}

.key-value-input__type-input {
  flex-basis: 0;
}

.key-value-input__value-input {
  flex-basis: 0;
  flex-grow: 2;
}
</style>
