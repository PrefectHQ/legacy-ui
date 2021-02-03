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
  watch: {
    internalValue(val) {
      this.$emit('input', val)
    }
  }
}
</script>

<template>
  <div class="list-input">
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
