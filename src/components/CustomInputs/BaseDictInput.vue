<template>
  <div class="base-dict-input">
    <div
      v-for="(entry, index) in entries"
      :key="index"
      class="base-dict-input__row"
    >
      <slot name="before-existing" :entry="entry" />
      <key-value-input
        :value="entry"
        :readonly="readonly"
        :show-types="showTypes"
        :types="types"
        @input="$emit('update', [$event, entry])"
      />
      <slot name="after-existing" :entry="entry" />
      <v-btn
        v-if="!readonly"
        class="base-dict-input__action"
        x-small
        icon
        @click="$emit('remove', entry)"
      >
        <v-icon color="red">remove_circle</v-icon>
      </v-btn>
    </div>
    <div
      v-if="!readonly"
      class="base-dict-input__row base-dict-input__row-last"
    >
      <slot name="before-new" :entry="newProperty" />
      <key-value-input
        ref="newPropertyForm"
        v-model="newProperty"
        :show-types="showTypes"
        :types="types"
        @tab="handleTab"
      />
      <slot name="after-new" :entry="newProperty">
        <v-btn
          class="base-dict-input__action"
          x-small
          icon
          @click="tryAddNewProperty"
        >
          <v-icon color="green">add_circle</v-icon>
        </v-btn>
      </slot>
    </div>
  </div>
</template>

<script>
import KeyValueInput from '@/components/CustomInputs/KeyValueInput'
import { types, isValidType } from '@/utils/types'

export default {
  name: 'BaseDictInput',
  components: {
    KeyValueInput
  },
  props: {
    entries: {
      type: Array,
      required: true,
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
  created() {
    this.resetNewProperty()
  },
  beforeDestroy() {
    this.tryAddNewProperty()
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

      this.$emit('add', this.newProperty)
      this.resetNewProperty()
      this.$refs.newPropertyForm.focus()
      return true
    }
  }
}
</script>

<style lang="scss">
.base-dict-input__row {
  display: flex;
}

.base-dict-input__row-last:not(:focus-within) {
  opacity: 0.5;
}

.key-value-input {
  flex-grow: 1;
}

.base-dict-input__action {
  flex-grow: 0;
  margin-top: 8px;
}
</style>
