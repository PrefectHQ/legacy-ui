<template>
  <div class="key-value-input">
    <v-text-field
      ref="keyInput"
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
        v-model="internalType"
        :items="types"
        label="Type"
        class="key-value-input__type-input"
        :error-messages="typeErrors"
        :disabled="readonly"
        outlined
        dense
      />
    </template>
    <v-text-field
      ref="valueInput"
      v-model="internalValue"
      label="Value"
      class="key-value-input__value-input"
      :error-messages="valueErrors"
      outlined
      dense
      @keydown.tab="$emit('tab', $event)"
    />
  </div>
</template>

<script>
import { parseJson, formatJson, isValidJson } from '@/utils/json'
import { isIsoDateString } from '@/utils/dateTime'

export default {
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
      default: true
    },
    types: {
      type: Array,
      required: false,
      default: null,
      validator: value =>
        value.length === 0 ||
        value.every(type =>
          [
            'null',
            'boolean',
            'number',
            'string',
            'object',
            'array',
            'date'
          ].includes(type)
        )
    }
  },
  data() {
    return {
      showErrors: false
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
        if (isValidJson(value)) {
          this.$emit('input', {
            ...this.value,
            value: parseJson(value)
          })
        } else {
          this.$emit('input', { ...this.value, value: value })
        }
      }
    },
    internalType: {
      get() {
        const type = this.tryDiscoveringType(this.internalValue)

        if (this.isTypeAcceptable(type)) {
          return type
        }

        return null
      },
      set(value) {
        const current = this.tryConvertingStringToType(this.internalValue)
        const converted = this.isTypeAcceptable(value)
          ? this.coerceType(current, value)
          : null

        this.$emit('input', { ...this.value, value: converted })
      }
    },
    keyIsEmpty() {
      return this.internalKey == null || this.internalKey.length == 0
    },
    keyErrors() {
      if (this.showErrors && this.keyIsEmpty) {
        return ['Key is required']
      }

      return []
    },
    valueCanBeEmpty() {
      return this.isTypeAcceptable('null') || this.isTypeAcceptable('string')
    },
    valueIsEmpty() {
      const json = formatJson(this.internalValue)

      return json == null || json.length == 0
    },
    valueErrors() {
      if (this.showErrors && this.valueIsEmpty && !this.valueCanBeEmpty) {
        return ['Value is required']
      }

      return []
    },
    typeErrors() {
      if (this.showErrors && this.internalType == null) {
        return ['Type is required']
      }

      return []
    }
  },
  methods: {
    isTypeAcceptable(type) {
      return this.types == null || this.types.includes(type)
    },
    tryConvertingStringToType(value) {
      const converted = isValidJson(value) ? parseJson(value) : value

      return converted
    },
    tryDiscoveringType(value) {
      const converted = isValidJson(value) ? parseJson(value) : value

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
    trySetDefaultValue() {
      if (this.internalValue != null || this.isTypeAcceptable('null')) {
        return
      }

      if (this.isTypeAcceptable('string')) {
        this.internalValue = ''
      }
    },
    validate() {
      this.showErrors = true

      this.trySetDefaultValue()

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
</style>
