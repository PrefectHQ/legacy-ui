<template>
  <div>
    <v-btn-toggle
      v-if="languages.length > 1"
      :value="mode"
      @change="changeMode"
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
    this.mode = this.languages[0]
  },
  methods: {
    changeMode(mode) {
      const value = this.tryGetValueObject()
      if (value != null) {
        this.internalValue = this.convertValue(mode, value)
      }

      this.mode = mode
    },
    convertValue(mode, value) {
      switch (mode) {
        case 'yaml':
          return formatYaml(value)
        case 'json':
          return formatJson(value)
        default:
          return value.toString()
      }
    },
    tryGetValueObject() {
      try {
        switch (this.mode) {
          case 'json':
            return parseJson(this.internalValue)
          case 'yaml':
            return parseYaml(this.internalValue)
          default:
            return this.internalValue
        }
      } catch {
        return null
      }
    }
  }
}
</script>
