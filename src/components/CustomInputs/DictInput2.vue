<template>
  <base-dict-input
    :entries="internalValue"
    :readonly-key="readonlyKey"
    :readonly-type="readonlyType"
    :readonly-value="readonlyValue"
    :disable-add="disableAdd"
    :disable-remove="disableRemove"
    :show-types="showTypes"
    :types="types"
    @add="handleAdd"
    @update="handleUpdate"
    @remove="handleRemove"
  />
</template>

<script>
import BaseDictInput from '@/components/CustomInputs/BaseDictInput'
import readonlyProps from '@/components/CustomInputs/readonlyProps'
import { isValidJson, parseJson, formatJson } from '@/utils/json'
import { types, isValidType } from '@/utils/types'

export default {
  name: 'DictInput',
  components: {
    BaseDictInput
  },
  props: {
    value: {
      type: String,
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
  computed: {
    internalValue: {
      get() {
        return this.convertValueToArray(this.value)
      },
      set(value) {
        if (this.isArrayString(this.value)) {
          this.$emit('input', formatJson(value))
        }

        this.$emit('input', formatJson(this.convertArrayToObject(value)))
      }
    }
  },
  methods: {
    isArray(value) {
      return typeof value === 'object' && Array.isArray(value)
    },
    isArrayString(value) {
      return isValidJson(value) && this.isArray(parseJson(value))
    },
    convertValueToArray(value) {
      if (value == null || !isValidJson(value)) {
        return []
      }

      if (this.isArray(value)) {
        return value
      }

      const objectValue = parseJson(value)

      if (this.isArray(objectValue)) {
        return objectValue
      }

      const objectEntries = Object.entries(objectValue)

      return objectEntries.map(([key, value]) => ({ key, value }))
    },
    convertArrayToObject(array) {
      return array.reduce((value, entry) => {
        value[entry.key] = entry.value

        return value
      }, {})
    },
    handleAdd(entry) {
      this.internalValue = [...this.internalValue, entry]
    },
    handleUpdate([entry, previous]) {
      this.internalValue = [
        ...this.internalValue.map(x => (x.key == previous.key ? entry : x))
      ]
    },
    handleRemove({ key }) {
      this.internalValue = [...this.internalValue.filter(x => x.key != key)]
    }
  }
}
</script>
