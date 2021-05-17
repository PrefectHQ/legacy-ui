<script>
import JsonInput from '@/components/CustomInputs/JsonInput'
import YamlInput from '@/components/CustomInputs/YamlInput'
import jsBeautify from 'js-beautify'

import { parse, stringify } from 'yaml'

export default {
  components: {
    JsonInput,
    YamlInput
  },
  props: {
    value: {
      type: [Object, String],
      required: false,
      default: () => {
        return ''
      }
    }
  },
  data() {
    return {
      mode: 'json',
      jsonInput: '{}',
      yamlInput: ''
    }
  },
  computed: {
    internalValue() {
      if (this.mode == 'yaml') return this.yamlInput
      if (this.mode == 'json') {
        try {
          return JSON.parse(this.jsonInput)
        } catch {
          return this.jsonInput
        }
      }
      return null
    }
  },
  watch: {
    // Allows swapping between json input and yaml inputs
    mode(val) {
      if (val == 'json') {
        this.jsonInput = jsBeautify(
          JSON.stringify(parse(this.yamlInput) || {}),
          {
            indent_size: 4,
            space_in_empty_paren: true,
            preserve_newlines: false
          }
        )

        // Use next tick to make sure the json input element exists
        this.$nextTick(() => {
          this.$refs['json-input'].validateJson()
        })
      } else {
        if (this.jsonInput === '{}') {
          this.yamlInput = ''
        } else {
          this.yamlInput = stringify(JSON.parse(this.jsonInput))
        }
      }

      this.$emit('input', this.internalValue)
    }
  },
  mounted() {
    if (this.value && typeof this.value == 'object') {
      this.mode = 'json'

      const val = JSON.stringify(this.value)

      this.jsonInput = jsBeautify(val, {
        indent_size: 4,
        space_in_empty_paren: true,
        preserve_newlines: false
      })

      this.yamlInput = stringify(this.value)
    } else if (this.value) {
      this.mode = 'yaml'
      this.yamlInput = stringify(this.value)
    }
  },
  methods: {
    _handleJsonInput() {
      // Allows swapping between json input and key value pairs
      try {
        const json = JSON.parse(this.jsonInput)

        this.keys = Object.keys(json)
        this.values = Object.values(json)
      } catch {
        this.$refs['json-input'].validateJson()
      }
    },
    _handleKeypress() {
      this.$emit('input', this.internalValue)
    },
    _handleYamlInput() {},
    switchMode() {
      this.mode = this.mode == 'yaml' ? 'json' : 'yaml'
    }
  }
}
</script>

<template>
  <div class="position-relative">
    <div class="d-flex justify-end align-center mb-1" style="width: 100%;">
      <span
        class="d-flex justify-end align-center cursor-pointer"
        @click="switchMode"
      >
        <span
          class="text-body-2"
          :class="{ 'font-weight-bold': mode == 'json' }"
        >
          JSON
        </span>
        <v-switch
          inset
          color="orange"
          class="mt-0 small-switch v-input--reverse multi-color-switch"
          :class="{
            'green--text': mode == 'json',
            'orange--text': mode == 'yaml'
          }"
          hide-details
          :value="mode == 'yaml'"
          @click.stop="switchMode"
        ></v-switch>
        <span
          class="text-body-2"
          :class="{ 'font-weight-bold': mode == 'yaml' }"
        >
          YAML
        </span>
      </span>
    </div>

    <div v-if="mode == 'json'">
      <JsonInput
        ref="json-input"
        v-model="jsonInput"
        background-color="white"
        selected-type="json"
        prepend-icon="fad fa-file-code"
        prepend-icon-label="JSON"
        @input="_handleKeypress"
      />
    </div>

    <div v-else-if="mode == 'yaml'">
      <YamlInput
        ref="yaml-input"
        v-model="yamlInput"
        background-color="white"
        prepend-icon="fad fa-file-alt"
        prepend-icon-label="YAML"
        @input="_handleKeypress"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.remove-button {
  position: absolute;
  right: 0;
}
</style>
