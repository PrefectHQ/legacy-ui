<template>
  <div class="yaml-input">
    <v-textarea
      v-model="internalValue"
      class="yaml-input__textarea"
      spellcheck="false"
      rows="8"
      :error-messages="errors"
      outlined
      @blur="handleBlur"
    >
      <template #append>
        <highlight-code lang="yaml" class="yaml-input__preview">
          {{ internalValue }}
        </highlight-code>
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
import { parseYaml, formatYaml, getYamlErrors } from '@/utils/yaml'

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
      return getYamlErrors(this.internalValue)
    }
  },
  methods: {
    handleBlur() {
      const objectValue = parseYaml(this.internalValue)
      const formatted = formatYaml(objectValue)

      if (formatted != null) {
        this.internalValue = formatted
      }
    }
  }
}
</script>

<style lang="scss">
.yaml-input {
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

  .yaml-input__textarea .v-text-field__slot {
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

  .yaml-input__preview {
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
      content: 'YAML';
      color: rgba(255, 152, 0, 0.35);
      position: absolute;
      bottom: 5px;
      right: 5px;
    }
  }
}
</style>
