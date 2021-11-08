<template>
  <base-dict-input
    ref="editor"
    :entries="internalValue"
    :readonly-key="readonlyKey"
    :readonly-type="readonlyType"
    :readonly-value="readonlyValue"
    :disable-add="disableAdd"
    :disable-remove="disableRemove"
    :show-types="showTypes"
    :types="types"
    class="checkbox-dict-input"
    @add="handleAdd"
    @update="handleUpdate"
    @remove="handleRemove"
  >
    <template #before-existing="{entry, index}">
      <v-checkbox
        :input-value="checked.includes(entry.key)"
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
import readonlyProps from '@/components/CustomInputs/readonlyProps'
import { isValidJson, tryParseJson, tryFormatJson } from '@/utils/json'
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
    checked: {
      type: Array,
      required: false,
      default: () => []
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
    internalValue() {
      return this.convertValueToArray(this.value)
    }
  },
  methods: {
    isArray(value) {
      return typeof value === 'object' && Array.isArray(value)
    },
    isArrayString(value) {
      return isValidJson(value) && this.isArray(tryParseJson(value))
    },
    emitValue(value) {
      const jsonValue = this.isArrayString(this.value)
        ? tryFormatJson(value)
        : tryFormatJson(this.convertArrayToObject(value))

      this.$emit('input', jsonValue)
    },
    check(key) {
      this.$emit('update:checked', [...this.checked.filter(x => x != key), key])
    },
    uncheck(key) {
      this.$emit('update:checked', [...this.checked.filter(x => x != key)])
    },
    convertValueToArray(value) {
      if (value == null || !isValidJson(value)) {
        return []
      }

      if (this.isArray(value)) {
        return value
      }

      const objectValue = tryParseJson(value)

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
      this.emitValue([...this.internalValue, entry])
      this.check(entry.key)
    },
    updateEntry(key, entry) {
      this.emitValue([
        ...this.internalValue.map(x => (x.key == key ? entry : x))
      ])
      this.check(entry.key)
    },
    removeEntry({ key }) {
      this.emitValue([...this.internalValue.filter(x => x.key != key)])
      this.uncheck(key)
    },
    addToValue(entry) {
      this.emitValue([...this.internalValue, entry])
    },
    removeFromValue({ key }) {
      this.emitValue([...this.internalValue.filter(x => x.key != key)])
    },
    handleCheck(checked, { key }) {
      if (checked) {
        this.check(key)
      } else {
        this.uncheck(key)
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
    },
    validate() {
      return this.$refs.editor.validate()
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
