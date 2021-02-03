<script>
export default {
  props: {
    value: {
      type: Array,
      required: false,
      default: () => []
    },
    items: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  data() {
    return {
      internalValue: this.value,
      // Used to reset the list
      initialValue: this.value
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
    <div class="d-flex align-center justify-end mb-2">
      <v-btn
        x-small
        class="text-normal mr-2"
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
        x-small
        class="text-normal"
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
      label="Labels"
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
  </div>
</template>
