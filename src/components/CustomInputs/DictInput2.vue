<template>
  <div class="dict-input">
    <div
      v-for="(entry, index) in arrayValue"
      :key="entry.key"
      class="dict-input__row"
    >
      <key-value-input :value="entry" @input="setEntryAtIndex(index, $event)" />
      <v-btn
        class="dict-input__remove"
        x-smll
        icon
        @click="setEntryAtIndex(index)"
      >
        <v-icon color="red">remove_circle</v-icon>
      </v-btn>
    </div>
    <div class="dict-input__row">
      <key-value-input
        ref="newPropertyForm"
        v-model="newProperty"
        @tab="handleTab"
      />
      <v-btn class="dict-input__remove" x-smll icon @click="tryAddNewProperty">
        <v-icon color="green">add_circle</v-icon>
      </v-btn>
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
    },
    readonlyKeys: {
      type: Boolean,
      required: false,
      default: false
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
    valueIsArray() {
      return Array.isArray(this.objectValue)
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
        return this.convertValueToArray(this.objectValue)
      },
      set(value) {
        this.objectValue = this.convertArrayToValue(value)
      }
    }
  },
  created() {
    this.resetNewProperty()
  },
  methods: {
    resetNewProperty() {
      this.newProperty = { key: null, value: null }
    },
    handleTab(event) {
      if (this.tryAddNewProperty()) {
        event.preventDefault()
      }
    },
    tryAddNewProperty() {
      if (!this.$refs.newPropertyForm.validate()) {
        return false
      }

      this.setEntryAtIndex(this.arrayValue.length, this.newProperty)
      this.resetNewProperty()
      this.$refs.newPropertyForm.focus()
      return true
    },
    setEntryAtIndex(index, entry) {
      const newArray = [...this.arrayValue]

      if (entry != null) {
        newArray.splice(index, 1, entry)
      } else {
        newArray.splice(index, 1)
      }

      this.arrayValue = newArray
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

<style lang="scss">
.dict-input__row {
  display: flex;
}

.dict-input__row:last-of-type:not(:focus-within) {
  opacity: 0.5;
}

.key-value-input {
  flex-grow: 1;
}

.dict-input__remove {
  flex-grow: 0;
}
</style>
