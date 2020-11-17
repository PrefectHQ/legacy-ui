<script>
export default {
  props: {
    content: {
      type: String,
      required: false,
      default: () => null
    },
    label: {
      type: String,
      required: false,
      default: () => null
    },
    loading: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      focused: false,
      isEditing: false,
      value: this.content
    }
  },
  methods: {
    discard() {
      this.focused = false
      this.$refs['edit-input']?.blur()

      this.value = this.content
    },
    edit() {
      this.focused = true
      console.log(this.$refs)
      this.$refs['edit-input']?.focus()
    },
    save() {
      this.focused = false
      this.$refs['edit-input']?.blur()

      this.$emit('change', this.value)
    }
  }
}
</script>

<template>
  <div
    v-click-outside="discard"
    class="inherited-text-field"
    :class="{ focused: focused, 'cursor-pointer': !focused }"
  >
    <v-icon small class="edit-icon">edit</v-icon>

    <div class="input-container">
      <input
        ref="edit-input"
        v-model="value"
        class="truncate"
        :class="{ 'cursor-pointer': !focused }"
        @disabled="!isEditing"
        @focus="focused = true"
        @keyup.enter="save"
      />
    </div>

    <div v-if="focused" class="button-container">
      <v-btn depressed x-small class="mr-1" @click="discard">Cancel</v-btn>
      <v-btn depressed color="primary" x-small @click="save">Save</v-btn>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.button-container {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translate(0, -50%);
}

.inherited-text-field {
  box-sizing: border-box;
  color: inherit !important;
  font-size: inherit !important;
  height: 30px;
  max-width: 100%;
  padding-bottom: 2px;
  position: relative;
  width: 100%;

  input,
  input:active {
    outline: none;
    width: 100%;
  }

  .input-container::after {
    background-color: #3b8dff;
    bottom: 0;
    content: '';
    height: 2px;
    left: 50%;
    position: absolute;
    transition: all 100ms;
    transition-delay: 100ms;
    width: 0%;
  }

  .edit-icon {
    left: -20px;
    opacity: 0;
    position: absolute;
    top: 6px;
    transition: all 150ms;
  }

  &.focused {
    .input-container {
      border-bottom: 1px solid #ddd;
      height: 100%;
    }

    .input-container::after {
      left: 0;
      width: 100%;
    }

    .edit-icon {
      opacity: 1;
    }
  }

  &:focus,
  &:hover {
    .edit-icon {
      opacity: 1;
    }
  }
}
</style>
