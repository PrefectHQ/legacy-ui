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
    },
    required: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  data() {
    return {
      error: false,
      focused: false,
      rules: {
        required: val => !!val || 'Required.',
        length: val => val?.length > 0 || 'At least one number is required'
      },
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
      if (this.loading) return

      this.focused = true

      this.$refs['edit-input']?.focus()
    },
    save() {
      this.error = this.value?.length === 0
      if (this.loading || this.value?.length === 0) return

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
    @click="edit"
  >
    <v-icon v-if="!loading" small class="prepend-input edit-icon">edit</v-icon>
    <v-progress-circular
      v-else
      indeterminate
      class="prepend-input"
      color="primary"
      size="16"
      width="2"
    />

    <v-menu
      :value="focused && required && (!value || value.length === 0) && error"
      :close-on-click="false"
      :open-on-click="false"
      :close-on-content-click="false"
      offset-y
      max-width="320"
      nudge-bottom="5"
    >
      <template #activator="{on}">
        <v-input
          class="input-container"
          :class="{
            'error-border': required && (!value || value.length === 0),
            disabled: loading
          }"
          hide-details
          :error="required && (!value || value.length === 0)"
          v-on="on"
          @disabled="loading"
        >
          <input
            ref="edit-input"
            v-model="value"
            class="text-truncate"
            :class="{
              'cursor-pointer': !focused
            }"
            :placeholder="`${label} (press enter to save)`"
            @disabled="loading"
            @keyup.enter="save"
            @keyup.esc="discard"
            @focus="focused = !loading && true"
          />
        </v-input>
      </template>

      <v-alert border="left" colored-border type="error" class="ma-0">
        {{ label }} can't be empty
      </v-alert>
    </v-menu>

    <!-- Not sure if we need to show these buttons since enter is a pretty natural interaction -->
    <!-- <div v-if="focused" class="button-container text-center">
      <v-btn block depressed color="primary" x-small @click="save">
        Save
      </v-btn>
      <v-btn
        block
        depressed
        x-small
        class="mr-1"
        color="transparent"
        @click="discard"
      >
        Cancel
      </v-btn>
    </div> -->
  </div>
</template>

<style lang="scss" scoped>
.button-container {
  position: absolute;
  right: -60px;
  top: 50%;
  transform: translate(0, -50%);
  width: 60px;
}

.prepend-input {
  display: inline-block;
  position: relative;
}

.edit-icon {
  opacity: 0;
  transition: all 150ms;
  width: 0;
}

.inherited-text-field {
  box-sizing: border-box;
  color: inherit !important;
  font-size: inherit !important;
  height: 28px;
  max-width: 100%;
  padding-bottom: 2px;
  position: relative;
  width: 100%;

  .v-input {
    color: inherit !important;
    font-size: inherit !important;
  }

  .input-container {
    display: inline-block;
    width: calc(100% - 20px);

    input,
    input:active {
      color: inherit !important;
      outline: none;
      transition: all 100ms;
      width: 100%;
    }

    &.disabled {
      color: var(--v-utilGrayMid-base) !important;
      cursor: progress;

      input {
        pointer-events: none;
      }
    }

    &::after {
      background-color: var(--v-primary-base);
      bottom: 0;
      content: '';
      height: 2px;
      left: 50%;
      position: absolute;
      transition: all 100ms;
      transition-delay: 10ms;
      width: 0%;
    }

    &.error-border::after {
      background-color: var(--v-error-base);
      transition-delay: 0;
    }
  }

  &.focused {
    .input-container {
      border-bottom: 1px solid var(--v-utilGrayLight-base);
      height: 100%;
    }

    .input-container::after {
      left: 20px;
      width: calc(100% - 20px);
    }

    .edit-icon {
      margin-right: 4px;
      opacity: 1;
      width: 16px;
    }
  }

  &:focus,
  &:hover {
    .edit-icon {
      margin-right: 4px;
      opacity: 1;
      width: 16px;
    }
  }
}
</style>
