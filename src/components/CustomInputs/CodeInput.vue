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
      ref="editor"
      v-model="internalValue"
      v-bind="editorProps[internalMode]"
      @update:checked="$emit('update:checked', $event)"
    />
  </div>
</template>

<script>
import JsonInput2 from '@/components/CustomInputs/JsonInput2'
import YamlInput2 from '@/components/CustomInputs/YamlInput2'
import DictInput2 from '@/components/CustomInputs/DictInput2'
import CheckboxDictInput from '@/components/CustomInputs/CheckboxDictInput'
import readonlyProps from '@/components/CustomInputs/readonlyProps'
import Textarea from 'vuetify/lib/components/VTextarea'
import { tryParseJson, tryFormatJson } from '@/utils/json'
import { tryParseYaml, formatYaml } from '@/utils/yaml'
import { types, isValidType } from '@/utils/types'

export default {
  name: 'CodeInput',
  props: {
    value: {
      type: String,
      required: false,
      default: null
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
    checked: {
      type: Array,
      required: false,
      default: () => []
    },
    ...readonlyProps
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
        this.$emit('update:mode', value)
        this.localMode = value
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
          placeholder: this.placeholder,
          disabled: this.readonlyValue
        },
        yaml: {
          placeholder: this.placeholder,
          disabled: this.readonlyValue
        },
        text: {
          placeholder: this.placeholder,
          disabled: this.readonlyValue,
          outlined: true,
          autoGrow: true
        },
        dict: {
          readonlyKey: this.readonlyKey,
          readonlyType: this.readonlyType,
          readonlyValue: this.readonlyValue,
          disableAdd: this.disableAdd,
          disableRemove: this.disableRemove,
          showTypes: this.showTypes,
          types: this.types,
          checked: this.checked
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
    setMode(mode) {
      if (this.internalValue != null) {
        const value = this.tryGetValueObject(this.internalValue)

        if (value != null) {
          this.internalValue = this.formatValueToString(mode, value)
        }
      }

      this.internalMode = mode
    },
    formatValueToString(mode, value) {
      switch (mode) {
        case 'yaml':
          return formatYaml(value)
        case 'json':
          return tryFormatJson(value)
        case 'dict':
          return tryFormatJson(value)
        case 'text':
          return tryFormatJson(value)
      }
    },
    tryGetValueObject(value) {
      return tryParseYaml(value) ?? tryParseJson(value)
    },
    validate() {
      if (this.internalMode == 'text') {
        return true
      }

      return this.$refs.editor.validate()
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
  align-self: flex-end;
  margin-bottom: 8px;
}
</style>
