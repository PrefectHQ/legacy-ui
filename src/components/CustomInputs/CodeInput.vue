<template>
  <div class="code-input">
    <v-btn-toggle
      v-if="editors.length > 1"
      class="code-input__toggle"
      :value="internalMode"
      mandatory
      @change="setMode"
    >
      <v-btn
        v-for="editor in editors"
        :key="editor"
        :value="editor"
        class="code-input__language-btn"
        x-small
      >
        {{ editor }}
      </v-btn>
    </v-btn-toggle>
    <component
      :is="editorComponents[internalMode]"
      v-model="internalValue"
      v-bind="editorProps[internalMode]"
      @update:entries="$emit('update:entries', $event)"
    />
  </div>
</template>

<script>
import JsonInput2 from '@/components/CustomInputs/JsonInput2'
import YamlInput2 from '@/components/CustomInputs/YamlInput2'
import DictInput2 from '@/components/CustomInputs/DictInput2'
import CheckboxDictInput from '@/components/CustomInputs/CheckboxDictInput'
import Textarea from 'vuetify/lib/components/VTextarea'
import { parseJson, formatJson } from '@/utils/json'
import { parseYaml, formatYaml } from '@/utils/yaml'
import { types, isValidType } from '@/utils/types'

export default {
  name: 'CodeInput',
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
    editors: {
      type: Array,
      required: false,
      default: () => ['dict', 'json'],
      validator: value =>
        value.length > 0 &&
        value.every(lang => ['json', 'yaml', 'dict', 'text'].includes(lang))
    },
    mode: {
      type: String,
      required: false,
      default: null,
      validator: value => ['json', 'yaml', 'dict', 'text'].includes(value)
    },
    showTypes: {
      type: Boolean,
      required: false,
      default: false
    },
    showCheckboxes: {
      type: Boolean,
      required: false,
      default: false
    },
    placeholder: {
      type: String,
      required: false,
      default: null
    },
    types: {
      type: Array,
      required: false,
      default: () => types,
      validator: value => value.every(isValidType)
    },
    entries: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      localMode: null
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
    internalMode: {
      get() {
        return this.mode ?? this.localMode
      },
      set(value) {
        if (this.mode) {
          this.$emit('update:mode', value)
        } else {
          this.localMode = value
        }
      }
    },
    editorComponents() {
      return {
        json: JsonInput2,
        yaml: YamlInput2,
        dict: this.showCheckboxes ? CheckboxDictInput : DictInput2,
        text: Textarea
      }
    },
    editorProps() {
      return {
        json: {
          placeholder: this.placeholder
        },
        yaml: {
          placeholder: this.placeholder
        },
        text: {
          placeholder: this.placeholder,
          outlined: true,
          autoGrow: true
        },
        dict: {
          readonly: this.readonly,
          showTypes: this.showTypes,
          types: this.types,
          entries: this.entries
        }
      }
    }
  },
  created() {
    if (this.internalMode == null) {
      this.setMode(this.editors[0])
    }
  },
  methods: {
    getStringValue(value) {
      return this.internalMode === 'yaml'
        ? formatYaml(value)
        : formatJson(value)
    },
    getObjectValue(value) {
      return parseYaml(value) ?? parseJson(value)
    },
    setMode(mode) {
      if (this.internalValue != null) {
        const value = this.tryGetValueObject(this.internalValue)

        this.internalValue = this.formatValueToString(mode, value)
      }

      this.internalMode = mode
    },
    formatValueToString(mode, value) {
      switch (mode) {
        case 'yaml':
          return formatYaml(value)
        case 'json':
          return formatJson(value)
        case 'dict':
          return formatJson(value)
        case 'text':
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
  display: flex;
  flex-direction: column;

  textarea {
    font-family: monospace, monospace;
    font-size: 13px;
    line-height: 13px !important;
    min-height: 56px;
    overflow-y: auto;
    resize: vertical;
  }
}

.code-input__toggle {
  align-self: end;
  margin-bottom: 8px;
}
</style>
