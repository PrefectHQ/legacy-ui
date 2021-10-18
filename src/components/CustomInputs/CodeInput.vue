<template>
  <div>
    <v-btn-toggle
      v-if="languages.length > 1"
      :value="mode"
      mandatory
      @change="setMode"
    >
      <v-btn
        v-for="language in languages"
        :key="language"
        :value="language"
        class="mb-1"
        small
      >
        {{ language }}
      </v-btn>
    </v-btn-toggle>
    <component :is="editorComponent" v-model="internalValue" />
  </div>
</template>

<script>
import JsonInput2 from '@/components/CustomInputs/JsonInput2'
import YamlInput2 from '@/components/CustomInputs/YamlInput2'
import DictInput2 from '@/components/CustomInputs/DictInput2'
import { parseJson, formatJson } from '@/utils/json'
import { parseYaml, formatYaml } from '@/utils/yaml'

export default {
  props: {
    value: {
      type: String,
      required: false,
      default: null
    },
    languages: {
      type: Array,
      required: false,
      default: () => ['json'],
      validator: value =>
        value.length > 0 &&
        value.every(lang => ['json', 'yaml', 'dict'].includes(lang))
    }
  },
  data() {
    return {
      mode: null,
      editors: {
        json: JsonInput2,
        yaml: YamlInput2,
        dict: DictInput2
      }
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
    editorComponent() {
      return this.editors[this.mode]
    }
  },
  created() {
    this.setMode(this.languages[0])
  },
  methods: {
    setMode(mode) {
      const value = this.tryGetValueObject(this.internalValue)

      this.internalValue = this.formatValueToString(mode, value)
      this.mode = mode
    },
    formatValueToString(mode, value) {
      switch (mode) {
        case 'yaml':
          return formatYaml(value)
        case 'json':
          return formatJson(value)
        case 'dict':
          return formatJson(value)
      }
    },
    tryGetValueObject(value) {
      return parseYaml(value) ?? parseJson(value)
    }
  }
}
</script>
<style lang="scss">
.code-input {
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

  .code-input__textarea .v-text-field__slot {
    width: 50%;
    margin-bottom: 4px;
    flex-grow: 0 !important;

    textarea {
      font-family: monospace, monospace;
      font-size: 13px;
      line-height: 13px !important;
    }
  }

  .code-input__preview {
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
}
</style>
