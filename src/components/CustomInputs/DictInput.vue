<script>
import JsonInput from '@/components/CustomInputs/JsonInput'
import jsBeautify from 'js-beautify'

export default {
  components: {
    JsonInput
  },
  props: {
    includeCheckbox: {
      type: Boolean,
      required: false,
      default: false
    },
    addLabel: {
      type: String,
      requird: false,
      default: 'Add key / value'
    },
    allowReset: {
      type: Boolean,
      required: false,
      default: () => false
    },
    dict: {
      type: [Object, Array],
      required: false,
      default: () => {
        return null
      }
    },
    disableEdit: {
      type: Boolean,
      required: false,
      default: () => false
    },
    keyLabel: {
      type: String,
      requird: false,
      default: 'Key'
    },
    valueLabel: {
      type: String,
      requird: false,
      default: 'Value'
    },
    defaultCheckedKeys: {
      type: Array,
      required: false,
      default: () => []
    }
  },
  data() {
    return {
      disabledKeys: [],
      json: false,
      jsonInput: '{}',
      keys: [],
      values: [],
      includedKeys: this.defaultCheckedKeys
    }
  },
  computed: {
    inputIsArray() {
      return Array.isArray(this.dict)
    },
    pairs() {
      return this.keys.map((p, i) => i)
    },
    value() {
      const dict = {}
      this.keys.forEach((k, i) => {
        // Ignore null key/val pairs
        if (k == null && this.values[i] == null) return
        if (
          !this.includeCheckbox ||
          (this.json && Object.keys(JSON.parse(this.jsonInput)).includes(k)) ||
          (!this.json && this.includedKeys.includes(k))
        ) {
          try {
            dict[k] =
              typeof this.values[i] == 'string'
                ? JSON.parse(this.values[i])
                : this.values[i]
          } catch {
            dict[k] = this.values[i]
          }
        }
      })
      return dict
    }
  },

  watch: {
    // Allows swapping between json input and key value pairs
    json(val) {
      if (val) {
        this.jsonInput = jsBeautify(this.jsonInput, {
          indent_size: 4,
          space_in_empty_paren: true,
          preserve_newlines: true,
          indent_empty_lines: true
        })

        // Use next tick to make sure the json input element exists
        this.$nextTick(() => {
          this.$refs['json-input'].validateJson()
        })
      } else {
        try {
          this.includedKeys = Object.keys(JSON.parse(this.jsonInput))
        } catch {
          this.includedKeys = Object.keys(this.value)
        }
      }

      this.$emit('toggle-json-editor', val)
    },
    includedKeys(val) {
      this.jsonInput = val.length > 0 ? JSON.stringify(this.value) : '{}'
      this.$emit('input', { ...this.value })
    }
  },
  mounted() {
    this.reset()
  },
  methods: {
    _handleJsonInput() {
      // Allows swapping between json input and key value pairs
      try {
        const json = JSON.parse(this.jsonInput)

        if (this.includeCheckbox) {
          Object.keys(json).forEach(k => {
            let i = this.keys.indexOf(k)

            if (i > -1) {
              this.values[i] =
                typeof json[k] === 'string' ? json[k] : JSON.stringify(json[k])
            } else {
              this.keys.push(k)
              this.values.push(
                typeof json[k] === 'string' ? json[k] : JSON.stringify(json[k])
              )
            }
          })
        } else {
          this.keys = Object.keys(json)
          this.values = Object.values(json).map(value =>
            typeof value === 'string' ? value : JSON.stringify(value)
          )
        }
        this.$emit('input', { ...this.value })
      } catch {
        this.$refs['json-input'].validateJson()
      }
    },
    _handleKeypress() {
      this.jsonInput = this.keys.length > 0 ? JSON.stringify(this.value) : '{}'
      this.$emit('input', { ...this.value })
    },
    addKeyValuePair() {
      this.keys.push(null)
      this.values.push(null)
    },
    removeKeyValuePair(i) {
      this.keys.splice(i, 1)
      this.values.splice(i, 1)

      if (this.keys.length === 0) {
        this.keys = [null]
        this.values = [null]
      }

      this.$emit('input', { ...this.value })
    },
    reset() {
      this.disabledKeys = this.inputIsArray
        ? this.dict
            .filter(entry => entry.disabled == true)
            .map(entry => entry.key)
        : []
      if (this.includeCheckbox && this.includedKeys.length === 0) {
        this.jsonInput = '{}'
      } else if (
        this.includeCheckbox &&
        this.includedKeys.length > 0 &&
        this.inputIsArray
      ) {
        const v = this.dict.filter(i => this.includedKeys.includes(i.key))

        this.jsonInput = JSON.stringify(
          Object.fromEntries(v.map(entry => [entry.key, entry.value]))
        )
      } else {
        this.jsonInput = this.inputIsArray
          ? JSON.stringify(
              Object.fromEntries(
                this.dict.map(entry => [entry.key, entry.value])
              )
            )
          : this.dict
          ? JSON.stringify(this.dict)
          : `
        {

        }
              `
      }

      this.keys = this.inputIsArray
        ? this.dict.map(entry => entry.key)
        : this.dict
        ? Object.keys(this.dict)
        : [null]

      this.values = this.inputIsArray
        ? this.dict.map(entry =>
            typeof entry.value == 'string'
              ? entry.value
              : JSON.stringify(entry.value)
          )
        : this.dict
        ? Object.values(this.dict).map(value => JSON.stringify(value))
        : [null]

      this.$emit('input', { ...this.value })
    }
  }
}
</script>

<template>
  <div class="position-relative">
    <div class="d-flex justify-end align-end mb-1" style="width: 100%;">
      <v-btn
        v-if="allowReset"
        x-small
        class="text-normal mr-2"
        depressed
        color="utilGrayLight"
        title="Reset"
        @click="reset"
      >
        Reset
        <v-icon small>refresh</v-icon>
      </v-btn>

      <v-switch
        v-model="json"
        inset
        label="JSON"
        class="mt-0 small-switch v-input--reverse"
        hide-details
      ></v-switch>
    </div>

    <div v-if="json">
      <JsonInput
        ref="json-input"
        v-model="jsonInput"
        prepend-icon="fad fa-file-code"
        prepend-icon-label="JSON"
        selected-type="json"
        @input="_handleJsonInput"
      />
    </div>

    <div v-else>
      <transition-group name="fade" mode="out-in">
        <v-row
          v-for="(pair, i) in pairs"
          :key="pair"
          no-gutters
          align="center"
          class="my-4 position-relative"
          :class="{ 'pr-8': !disableEdit }"
        >
          <v-col v-if="includeCheckbox" cols="1">
            <v-checkbox
              v-model="includedKeys"
              multiple
              :value="keys[i]"
            ></v-checkbox>
          </v-col>
          <v-col :cols="includeCheckbox ? 3 : 4" class="pr-3">
            <v-text-field
              v-model="keys[i]"
              class="text-body-1"
              hide-details
              outlined
              dense
              :placeholder="keyLabel"
              :readonly="disabledKeys.includes(keys[i])"
              @keyup="_handleKeypress"
            />
          </v-col>
          <v-col cols="8" class="pl-3">
            <v-text-field
              v-model="values[i]"
              class="text-body-1"
              hide-details
              outlined
              dense
              :placeholder="
                inputIsArray && dict[i] && dict[i].value
                  ? dict[i].value.toString()
                  : valueLabel
              "
              :readonly="
                includeCheckbox ? !includedKeys.includes(keys[i]) : false
              "
              @keyup="_handleKeypress"
            />
          </v-col>

          <v-btn
            v-if="
              !disableEdit &&
                (i !== 0 || keys[i] !== null || values[i] !== null)
            "
            class="remove-button"
            depressed
            icon
            fab
            x-small
            @click="removeKeyValuePair(i)"
          >
            <v-icon color="red">remove_circle</v-icon>
          </v-btn>
        </v-row>
      </transition-group>

      <div v-if="!disableEdit" class="text-center">
        <v-btn
          class="mx-auto px-8 text-none"
          depressed
          text
          color="primary"
          @click="addKeyValuePair"
        >
          {{ addLabel }}
          <v-icon right>
            add
          </v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.remove-button {
  position: absolute;
  right: 0;
}

.v-input--is-readonly {
  background-color: rgba(0, 0, 0, 0.03) !important;
}
</style>
