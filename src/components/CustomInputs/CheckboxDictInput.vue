<template>
  <base-dict-input
    :entries="combinedValue"
    :readonly="readonly"
    :show-types="showTypes"
    :types="types"
    class="checkbox-dict-input"
    @add="handleAdd"
    @update="handleUpdate"
    @remove="handleRemove"
  >
    <template #before-existing="{entry}">
      <v-checkbox
        :input-value="arrayValue.some(x => x.key == entry.key)"
        class="checkbox-dict-input__checkbox"
        @change="handleCheck($event, entry)"
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
import { convertValueToArray } from '@/utils/array'
import { parseJson, formatJson } from '@/utils/json'
import { types, isValidType } from '@/utils/types'
import { alphabeticallyByKey } from '@/utils/sort'

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
      newProperty: null,
      uncheckedEntries: []
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
        return convertValueToArray(this.objectValue)
      },
      set(value) {
        this.objectValue = this.convertArrayToValue(value)
      }
    },
    combinedValue() {
      return [...this.arrayValue, ...this.uncheckedEntries].sort((a, b) =>
        alphabeticallyByKey(a, b, 'key')
      )
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
    entryIsUnchecked({ key }) {
      return this.uncheckedEntries.some(x => x.key == key)
    },
    addChecked(entry) {
      this.arrayValue = [...this.arrayValue, entry]
    },
    updateChecked(key, entry) {
      this.arrayValue = [
        ...this.arrayValue.map(x => (x.key == key ? entry : x))
      ]
    },
    removeFromChecked({ key }) {
      this.arrayValue = [...this.arrayValue.filter(x => x.key != key)]
    },
    addUnchecked(entry) {
      this.uncheckedEntries = [...this.uncheckedEntries, entry]
    },
    updateUnchecked(key, entry) {
      this.uncheckedEntries = [
        ...this.uncheckedEntries.map(x => (x.key == key ? entry : x))
      ]
    },
    removeFromUnchecked({ key }) {
      this.uncheckedEntries = [
        ...this.uncheckedEntries.filter(x => x.key != key)
      ]
    },
    handleCheck(checked, entry) {
      if (checked) {
        this.removeFromUnchecked(entry)
        this.addChecked(entry)
      } else {
        this.removeFromChecked(entry)
        this.addUnchecked(entry)
      }
    },
    handleAdd(entry) {
      this.removeFromUnchecked(entry)
      this.addChecked(entry)
    },
    handleUpdate([entry, previous]) {
      if (this.entryIsUnchecked(previous)) {
        this.updateUnchecked(previous.key, entry)
      } else {
        this.updateChecked(previous.key, entry)
      }
    },
    handleRemove(entry) {
      if (this.entryIsUnchecked(entry)) {
        this.removeFromUnchecked(entry)
      } else {
        this.removeFromChecked(entry)
      }
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
