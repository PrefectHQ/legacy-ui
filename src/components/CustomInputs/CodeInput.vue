<template>
  <div class="code-input">
    <v-btn-toggle
      v-if="languages.length > 1"
      class="code-input__toggle"
      :value="mode"
      mandatory
      @change="setMode"
    >
      <v-btn
        v-for="language in languages"
        :key="language"
        :value="language"
        class="code-input__language-btn"
        x-small
      >
        {{ language }}
      </v-btn>
    </v-btn-toggle>
    <component
      :is="editors[mode]"
      v-model="internalValue"
      v-bind="editorProps[mode]"
    />
  </div>
</template>

<script>
import JsonInput2 from '@/components/CustomInputs/JsonInput2'
import YamlInput2 from '@/components/CustomInputs/YamlInput2'
import DictInput2 from '@/components/CustomInputs/DictInput2'
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
    languages: {
      type: Array,
      required: false,
      default: () => ['dict', 'json'],
      validator: value =>
        value.length > 0 &&
        value.every(lang => ['json', 'yaml', 'dict', 'text'].includes(lang))
    },
    showTypes: {
      type: Boolean,
      required: false,
      default: false
    },
    types: {
      type: Array,
      required: false,
      default: () => types,
      validator: value => value.every(isValidType)
    }
  },
  data() {
    return {
      mode: null,
      editors: {
        json: JsonInput2,
        yaml: YamlInput2,
        dict: DictInput2,
        text: Textarea
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
    editorProps() {
      return {
        json: {},
        yaml: {},
        dict: {
          readonly: this.readonly,
          showTypes: this.showTypes,
          types: this.types
        },
        text: { outlined: true, dense: true }
      }
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
}

.code-input__toggle {
  align-self: end;
  margin-bottom: 8px;
}
</style>
