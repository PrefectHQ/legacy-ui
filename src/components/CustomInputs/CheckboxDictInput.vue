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
    },
    internalEntries: {
      get() {
        return this.convertValueToArray(this.entries)
      },
      set(value) {
        if (this.isArrayString(this.entries)) {
          this.$emit('input', formatJson(value))
        }

        this.$emit(
          'update:entries',
          formatJson(this.convertArrayToObject(value))
        )
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
    entryIsUnchecked({ key }) {
      return this.internalValue.every(x => x.key != key)
    },
    addChecked(entry) {
      this.internalValue = [...this.internalValue, entry]
    },
    updateChecked(key, entry) {
      this.internalValue = [
        ...this.internalValue.map(x => (x.key == key ? entry : x))
      ]
    },
    removeFromChecked({ key }) {
      this.internalValue = [...this.internalValue.filter(x => x.key != key)]
    },
    addUnchecked(entry) {
      this.internalEntries = [...this.internalEntries, entry]
    },
    updateUnchecked(key, entry) {
      this.internalEntries = [
        ...this.internalEntries.map(x => (x.key == key ? entry : x))
      ]
    },
    removeFromUnchecked({ key }) {
      this.internalEntries = [...this.internalEntries.filter(x => x.key != key)]
    },
    handleCheck(checked, entry) {
      if (checked) {
        this.addChecked(entry)
      } else {
        this.removeFromChecked(entry)
      }
    },
    handleAdd(entry) {
      this.addUnchecked(entry)
      this.addChecked(entry)
    },
    handleUpdate([entry, previous]) {
      this.updateUnchecked(previous.key, entry)
      this.updateChecked(previous.key, entry)
    },
    handleRemove(entry) {
      this.removeFromUnchecked(entry)
      this.removeFromChecked(entry)
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
