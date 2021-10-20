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
        class="mb-1"
        small
      >
        {{ language }}
      </v-btn>
    </v-btn-toggle>
    <component
      :is="editorComponent"
      v-model="internalValue"
      :readonly="readonly"
    />
  </div>
</template>

<script>
import JsonInput2 from '@/components/CustomInputs/JsonInput2'
import YamlInput2 from '@/components/CustomInputs/YamlInput2'
import DictInput2 from '@/components/CustomInputs/DictInput2'
import { parseJson, formatJson } from '@/utils/json'
import { parseYaml, formatYaml } from '@/utils/yaml'

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
  display: flex;
  flex-direction: column;
}

.code-input__toggle {
  align-self: end;
}
</style>
