<template>
  <div class="key-value-input">
    <v-text-field
      ref="keyInput"
      v-model="internalKey"
      class="key-value-input__key-input"
      :error-messages="keyErrors"
      outlined
      dense
    >
      <template #label>
        <slot name="key-label">
          Key
        </slot>
      </template>
    </v-text-field>
    <v-text-field
      ref="valueInput"
      v-model="internalValue"
      class="key-value-input__value-input"
      :error-messages="valueErrors"
      outlined
      dense
      @keydown.tab="handleTab"
    >
      <template #label>
        <slot name="value-label">
          Value
        </slot>
      </template>
    </v-text-field>
  </div>
</template>

<script>
import { parseJson, formatJson, isValidJson } from '@/utils/json'

export default {
  props: {
    value: {
      type: Object,
      required: false,
      default: null
    }
    // coerced-type (current)? user selects type?
  },
  data() {
    return {
      showErrors: false
    }
  },
  computed: {
    internalKey: {
      get() {
        if (!this.value) {
          return null
        }

        return this.value.key
      },
      set(value) {
        this.$emit('input', { ...this.value, key: value })
      }
    },
    internalValue: {
      get() {
        if (!this.value) {
          return null
        }

        const internalValue = this.value.value

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
    keyErrors() {
      if (this.showErrors && this.isEmpty(this.internalKey)) {
        return ['Key is required']
      }

      return []
    },
    valueErrors() {
      if (this.showErrors && this.isEmpty(this.internalValue)) {
        return ['Value is required']
      }

      return []
    }
  },
  methods: {
    handleTab(event) {
      this.$emit('tab', event)
    },
    getLength(value) {
      switch (typeof value) {
        case 'string':
          return value.length
        case 'object':
          return Array.isArray(value) ? value.length : Object.keys(value).length
      }
    },
    isEmpty(value) {
      if (value == null) {
        return true
      }

      if (this.getLength(value) === 0) {
        return true
      }

      return false
    },
    focus() {
      this.$refs.keyInput.focus()
      this.showErrors = false
    },
    validate() {
      this.showErrors = true
      return this.keyErrors.length == 0 && this.valueErrors == 0
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
</style>
