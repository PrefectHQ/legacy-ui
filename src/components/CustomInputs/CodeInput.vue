<template>
  <div>
    <v-btn-toggle v-if="languages.length > 1" :value="mode" @change="setMode">
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
      type: [String, Object, Array],
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
    shouldFormatValueToString() {
      return typeof this.value === 'string'
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
      const value = this.tryGetValueObject()

      if (value != null) {
        this.internalValue = this.shouldFormatValueToString
          ? this.formatValueToString(mode, value)
          : value
      }

      this.mode = mode
    },
    formatValueToString(mode, value) {
      switch (mode) {
        case 'yaml':
          return formatYaml(value)
        case 'json':
          return formatJson(value)
        default:
          return formatJson(value)
      }
    },
    tryGetValueObject() {
      try {
        switch (this.mode) {
          case 'yaml':
            return parseYaml(this.internalValue)
          case 'json':
            return parseJson(this.internalValue)
          default:
            return parseJson(this.internalValue)
        }
      } catch {
        return null
      }
    }
  }
}
</script>
