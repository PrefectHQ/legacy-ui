<template>
  <base-dict-input
    :entries="internalEntries"
    :readonly="readonly"
    :show-types="showTypes"
    :types="types"
    class="checkbox-dict-input"
    @add="handleAdd"
    @update="handleUpdate"
    @remove="handleRemove"
  >
    <template #before-existing="{entry, index}">
      <v-checkbox
        :input-value="internalValue.some(x => x.key == entry.key)"
        class="checkbox-dict-input__checkbox"
        @change="handleCheck($event, entry, index)"
      />
    </template>
    <template #before-new>
      <v-checkbox
        class="checkbox-dict-input__checkbox"
        :input-value="true"
        disabled
      />
    </template>
  </base-dict-input>
</template>

<script>
import BaseDictInput from '@/components/CustomInputs/BaseDictInput'
import { isValidJson, parseJson, formatJson } from '@/utils/json'
import { types, isValidType } from '@/utils/types'

export default {
  name: 'CheckboxDictInput',
  components: {
    BaseDictInput
  },
  props: {
    value: {
      type: String,
      required: false,
      default: null
    },
    entries: {
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
    internalValue() {
      return this.convertValueToArray(this.value)
    },
    internalEntries() {
      return this.convertValueToArray(this.entries)
    }
  },
  methods: {
    isArray(value) {
      return typeof value === 'object' && Array.isArray(value)
    },
    isArrayString(value) {
      return isValidJson(value) && this.isArray(parseJson(value))
    },
    emitValueAndEntries(value) {
      this.emitValue(value)
      this.emitEntries(value)
    },
    emitValue(value) {
      const jsonValue = this.isArrayString(this.value)
        ? formatJson(value)
        : formatJson(this.convertArrayToObject(value))

      this.$emit('input', jsonValue)
    },
    emitEntries(value) {
      const jsonValue = this.isArrayString(this.value)
        ? formatJson(value)
        : formatJson(this.convertArrayToObject(value))

      this.$emit('update:entries', jsonValue)
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
    entryIsUnchecked({ key }) {
      return this.internalValue.every(x => x.key != key)
    },
    addEntry(entry) {
      this.emitValueAndEntries([...this.internalEntries, entry])
    },
    updateEntry(key, entry) {
      this.emitValueAndEntries([
        ...this.internalEntries.map(x => (x.key == key ? entry : x))
      ])
    },
    removeEntry({ key }) {
      this.emitValueAndEntries([
        ...this.internalEntries.filter(x => x.key != key)
      ])
    },
    addToValue(entry) {
      this.emitValue([...this.internalValue, entry])
    },
    removeFromValue({ key }) {
      this.emitValue([...this.internalValue.filter(x => x.key != key)])
    },
    handleCheck(checked, entry) {
      if (checked) {
        this.addToValue(entry)
      } else {
        this.removeFromValue(entry)
      }
    },
    handleAdd(entry) {
      this.addEntry(entry)
    },
    handleUpdate([entry, previous]) {
      this.updateEntry(previous.key, entry)
    },
    handleRemove(entry) {
      this.removeEntry(entry)
    }
  }
}
</script>

<style lang="scss">
.checkbox-dict-input__checkbox {
  margin-top: 4px;

  .v-input__slot {
    margin: 0;
  }
}
</style>
