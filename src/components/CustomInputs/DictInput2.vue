<template>
  <div>
    <template v-for="(entry, index) in arrayValue">
      <key-value-input
        :key="entry.key"
        :value="entry"
        @input="setEntryAtIndex(index, $event)"
      />
    </template>
    <div>
      <key-value-input disabled />
    </div>
  </div>
</template>

<script>
import { parseJson, formatJson } from '@/utils/json'
import KeyValueInput from '@/components/CustomInputs/KeyValueInput'

export default {
  components: {
    KeyValueInput
  },
  props: {
    value: {
      type: String,
      required: false,
      default: null
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
    valueIsArray() {
      return Array.isArray(this.objectValue)
    },
    objectValue() {
      return parseJson(this.internalValue)
    },
    arrayValue() {
      return this.convertValueToArray(this.objectValue)
    }
  },
  methods: {
    setEntryAtIndex(index, entry) {
      this.arrayValue[index] = entry

      const converted = this.convertArrayToValue(this.arrayValue)

      this.internalValue = formatJson(converted)
    },
    convertValueToArray(value) {
      if (value == null) {
        return []
      }

      if (this.valueIsArray) {
        return value
      }

      return Object.entries(value).map(([key, value]) => ({
        key,
        value
      }))
    },
    convertArrayToValue(array) {
      if (array == null) {
        return null
      }

      if (this.valueIsArray) {
        return array
      }

      return array.reduce((objectValue, entry) => {
        objectValue[entry.key] = entry.value

        return objectValue
      }, {})
    }
  }
}
</script>
