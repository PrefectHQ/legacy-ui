<template>
  <div class="base-code-textarea">
    <v-textarea
      v-model="internalValue"
      class="base-code-textarea__textarea"
      spellcheck="false"
      :error-messages="errors"
      :disabled="readonly"
      auto-grow
      outlined
      @blur="handleBlur"
    >
      <template #append>
        <highlight-code :lang="language" class="base-code-textarea__preview">
          {{ internalValue }}
        </highlight-code>
        <span
          class="base-code-textarea__language"
          :class="`base-code-textarea__language-${language}`"
          >{{ language }}</span
        >
      </template>
      <template #message="{message}">
        <p style="white-space: pre-line">
          {{ message }}
        </p>
      </template>
    </v-textarea>
  </div>
</template>

<script>
export default {
  name: 'BaseCodeTextarea',
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
    language: {
      type: String,
      required: true,
      validator: value => ['json', 'yaml'].includes(value)
    },
    getErrors: {
      type: Function,
      required: true
    },
    parse: {
      type: Function,
      required: true
    },
    format: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      errors: []
    }
  },
  computed: {
    internalValue: {
      get() {
        return this.value
      },
      set(value) {
        this.errors = this.getErrors(value)

        this.$emit('input', value)
      }
    }
  },
  methods: {
    handleBlur() {
      const objectValue = this.parse(this.internalValue)
      const formatted = this.format(objectValue)

      if (formatted != null) {
        this.internalValue = formatted
      }
    }
  }
}
</script>

<style lang="scss">
.base-code-textarea {
  .v-input__append-inner {
    position: absolute;
    margin: 0;
    padding: 0;
    width: 50%;
    right: 2px;
    top: 2px;
    bottom: 2px;
  }

  .v-input__control {
    padding: 0;
  }

  .base-code-textarea__textarea .v-text-field__slot {
    width: 50%;
    margin-bottom: 4px;
    flex-grow: 0 !important;

    textarea {
      font-family: monospace, monospace;
      font-size: 13px;
      line-height: 13px !important;
      min-height: 56px;
      overflow-y: auto;
      resize: vertical;
    }
  }

  .base-code-textarea__preview {
    color: rgba(0, 0, 0, 0.87);
    width: 100%;
    word-wrap: break-word;
    white-space: pre-wrap;

    code {
      height: 100%;
      padding-top: 10px;
      padding-bottom: 8px;
      font-family: monospace, monospace;
      font-size: 13px;
      line-height: 13px;
    }
  }

  .base-code-textarea__language {
    position: absolute;
    bottom: 5px;
    right: 5px;
    text-transform: uppercase;
  }

  .base-code-textarea__language-json {
    color: rgba(76, 175, 80, 0.35);
  }

  .base-code-textarea__language-yaml {
    color: rgba(255, 152, 0, 0.35);
  }
}
</style>
