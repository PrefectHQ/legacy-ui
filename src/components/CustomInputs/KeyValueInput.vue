<template>
  <div class="key-value-input">
    <v-text-field
      v-model="internalKey"
      label="keyLabel"
      class="key-value-input__key-input"
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
      v-model="internalValue"
      label="valueLabel"
      class="key-value-input__value-input"
      outlined
      dense
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
    },
    // coerced-type (current)? user selects type?
    keyLabel: {
      type: String,
      required: false,
      default: 'key'
    },
    valueLabel: {
      type: String,
      required: false,
      default: 'value'
    }
  },
  computed: {
    internalKey: {
      get() {
        if (!this.value) {
          return null
        }

        return this.value[this.keyLabel]
      },
      set(value) {
        this.$emit('input', { ...this.value, [this.keyLabel]: value })
      }
    },
    internalValue: {
      get() {
        if (!this.value) {
          return null
        }

        const internalValue = this.value[this.valueLabel]

        if (typeof internalValue === 'object') {
          return formatJson(internalValue, 0)
        }

        return internalValue
      },
      set(value) {
        if (isValidJson(value)) {
          this.$emit('input', {
            ...this.value,
            [this.valueLabel]: parseJson(value)
          })
        } else {
          this.$emit('input', { ...this.value, [this.valueLabel]: value })
        }
      }
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
