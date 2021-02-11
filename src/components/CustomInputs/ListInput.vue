<script>
export default {
  props: {
    value: {
      type: Array,
      required: false,
      default: () => []
    },
    label: {
      type: String,
      required: false,
      default: () => null
    },
    items: {
      type: Array,
      required: false,
      default: () => []
    },
    showClear: {
      type: Boolean,
      required: false,
      default: () => true
    },
    showReset: {
      type: Boolean,
      required: false,
      default: () => true
    }
  },
  data() {
    return {
      internalValue: this.value ?? [],
      // Used to reset the list
      initialValue: this.value ?? []
    }
  },
  computed: {
    clearDisabled() {
      return this.internalValue.length === 0
    },
    resetDisabled() {
      return (
        this.initialValue.every(val => this.internalValue.includes(val)) &&
        this.initialValue.length === this.internalValue.length
      )
    }
  },
  watch: {
    internalValue(val) {
      this.$emit('input', val)
    }
  },
  methods: {
    clear() {
      this.internalValue = []
    },
    reset() {
      this.internalValue = this.initialValue
    }
  }
}
</script>

<template>
  <div>
    <div
      v-if="showClear || showReset"
      class="d-flex align-center justify-end mb-2"
    >
      <v-btn
        v-if="showReset"
        x-small
        class="text-normal"
        depressed
        color="blue-grey lighten-4"
        title="Reset"
        :disabled="resetDisabled"
        @click="reset"
      >
        Reset
        <v-icon small>refresh</v-icon>
      </v-btn>

      <v-btn
        v-if="showClear"
        x-small
        class="text-normal ml-2"
        depressed
        color="primary"
        title="Clear"
        :disabled="clearDisabled"
        @click="clear"
      >
        Clear
        <v-icon small>clear</v-icon>
      </v-btn>
    </div>
    <v-combobox
      v-model="internalValue"
      hide-selected
      :label="label"
      :items="items"
      :append-icon="items.length > 0 ? '$dropdown' : null"
      multiple
      small-chips
      hide-details
      outlined
    >
      <template #selection="{ item, parent }">
        <v-chip label small color="primary">
          <span class="pr-2">
            {{ item }}
          </span>

          <v-icon small @click="parent.selectItem(item)">
            close
          </v-icon>
        </v-chip>
      </template>
    </v-combobox>
    <div class="mt-1 text-caption">
      Hint: add to the list after typing by pressing the Enter key
    </div>
  </div>
</template>
