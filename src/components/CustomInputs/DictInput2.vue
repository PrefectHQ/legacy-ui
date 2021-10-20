<template>
  <base-dict-input
    :entries="arrayValue"
    :readonly="readonly"
    :show-types="showTypes"
    :types="types"
    @add="handleAdd"
    @update="handleUpdate"
    @remove="handleRemove"
  />
</template>

<script>
import BaseDictInput from '@/components/CustomInputs/BaseDictInput'
import { convertValueToArray } from '@/utils/array'
import { parseJson, formatJson } from '@/utils/json'
import { types, isValidType } from '@/utils/types'
import { alphabeticallyByKey } from '@/utils/sort'

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
      newProperty: null
    }
  },
  computed: {
    internalValue: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit('input', value)
      }
    },
    objectValue: {
      get() {
        return parseJson(this.internalValue)
      },
      set(value) {
        this.internalValue = formatJson(value)
      }
    },
    arrayValue: {
      get() {
        return convertValueToArray(this.objectValue).sort((a, b) =>
          alphabeticallyByKey(a, b, 'key')
        )
      },
      set(value) {
        this.objectValue = this.convertArrayToValue(value)
      }
    }
  },
  methods: {
    convertArrayToValue(array) {
      if (array == null) {
        return null
      }

      if (Array.isArray(this.objectValue)) {
        return array
      }

      return array.reduce((objectValue, entry) => {
        objectValue[entry.key] = entry.value

        return objectValue
      }, {})
    },
    handleAdd({ key, value }) {
      this.arrayValue = [...this.arrayValue, { key, value }]
    },
    handleUpdate({ key, value }) {
      this.arrayValue = [
        ...this.arrayValue.map(x => (x.key == key ? { key, value } : x))
      ]
    },
    handleRemove({ key }) {
      this.arrayValue = [...this.arrayValue.filter(x => x.key != key)]
    }
  }
}
</script>
