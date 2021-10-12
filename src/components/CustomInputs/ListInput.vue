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
      default: null
    },
    items: {
      type: Array,
      required: false,
      default: () => []
    },
    showClear: {
      type: Boolean,
      required: false,
      default: true
    },
    showClose: {
      type: Boolean,
      required: false,
      default: false
    },
    showReset: {
      type: Boolean,
      required: false,
      default: true
    },
    outline: {
      type: Boolean,
      required: false,
      default: true
    },
    rules: {
      type: Array,
      required: false,
      default: () => []
    },
    hide: {
      type: Boolean,
      required: false,
      default: true
    }
  },
  data() {
    return {
      initialValue: []
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
    },
    internalValue: {
      get() {
        return this.value ?? []
      },
      set(value) {
        this.$emit('input', value)
      }
    }
  },
  created() {
    this.initialValue = [...this.internalValue]
  },
  methods: {
    clear() {
      this.internalValue = []
    },
    reset() {
      this.internalValue = this.initialValue
    },
    close() {
      this.$emit('next')
    }
  }
}
</script>

<template>
  <div class="list-input">
    <div
      v-if="showClear || showReset || showClose"
      class="d-flex align-center justify-end mb-2"
    >
      <v-btn
        v-if="showReset"
        x-small
        class="text-normal"
        depressed
        color="utilGrayLight"
        title="Reset"
        :disabled="resetDisabled"
        @click="reset"
      >
        Reset
        <v-icon small>refresh</v-icon>
      </v-btn>
      <v-btn
        v-if="showClose"
        :disabled="clearDisabled"
        x-small
        class="text-normal"
        depressed
        color="primary"
        title="Next"
        @click="close"
      >
        Next
        <v-icon small>call_made</v-icon>
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
      :rules="rules"
      :hide-details="hide"
      :outlined="outline"
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
    <div v-if="!rules.length" class="mt-1 text-caption">
      Hint: add to the list after typing by pressing the Enter key
    </div>
  </div>
</template>
