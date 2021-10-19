<template>
  <div class="json-input">
    <v-textarea
      v-model="internalValue"
      class="json-input__textarea"
      spellcheck="false"
      rows="8"
      :error-messages="errors"
      outlined
      @blur="handleBlur"
    >
      <template #append>
        <highlight-code lang="json" class="json-input__preview">
          {{ internalValue }}
        </highlight-code>
      </template>
    </v-textarea>
  </div>
</template>

<script>
import { parseJson, formatJson, getJsonErrors } from '@/utils/json'

export default {
  props: {
    value: {
      type: String,
      required: false,
      default: null
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
    errors() {
      return getJsonErrors(this.internalValue)
    }
  },
  methods: {
    handleBlur() {
      const objectValue = parseJson(this.internalValue)
      const formatted = formatJson(objectValue)

      if (formatted != null) {
        this.internalValue = formatted
      }
    }
  }
}
</script>

<style lang="scss">
.json-input {
  .v-input__append-inner {
    position: absolute;
    margin: 0;
    padding: 0;
    width: 50%;
    right: 0;
    top: 0;
    bottom: 0;
  }

  .v-input__control {
    padding: 0;
  }

  .json-input__textarea .v-text-field__slot {
    width: 50%;
    margin-bottom: 4px;
    flex-grow: 0 !important;

    textarea {
      font-family: monospace, monospace;
      font-size: 13px;
      line-height: 13px !important;
      min-height: 56px;
    }
  }

  .json-input__preview {
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

    &::after {
      content: 'JSON';
      color: rgba(76, 175, 80, 0.35);
      position: absolute;
      bottom: 5px;
      right: 5px;
    }
  }
}
</style>
