<script>
import JsonInput from '@/components/CustomInputs/JsonInput'
import jsBeautify from 'js-beautify'

export default {
  components: {
    JsonInput
  },
  props: {
    addLabel: {
      type: String,
      requird: false,
      default: 'Add key / value'
    },
    dict: {
      type: Object,
      required: false,
      default: () => {
        return null
      }
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
    }
  },
  data() {
    return {
      json: false,
      jsonInput: '{}',
      keys: this.dict ? Object.keys(this.dict) : [null],
      values: this.dict ? Object.values(this.dict) : [null]
    }
  },
  computed: {
    pairs() {
      return this.keys.map((p, i) => i)
    },
    value() {
      const dict = {}
      this.keys.map((k, i) => (dict[k] = this.values[i]))
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
          preserve_newlines: false
        })

        // Use next tick to make sure the json input element exists
        this.$nextTick(() => {
          this.$refs['json-input'].validateJson()
        })
      }
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
      this.jsonInput = this.keys.length > 0 ? JSON.stringify(this.value) : '{}'
      this.$emit('change', this.value)
    },
    addKeyValuePair() {
      this.keys.push(null)
      this.values.push(null)
    },
    removeKeyValuePair(i) {
      this.keys.splice(i, 1)
      this.values.splice(i, 1)
      this.$emit('change', this.value)
    }
  }
}
</script>

<template>
  <div class="position-relative">
    <div class="d-flex justify-end align-start mb-1" style="width: 100%;">
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
        background-color="white"
        prepend-icon="fad fa-key"
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
          class="my-4 position-relative pr-8"
        >
          <v-col cols="4" class="pr-3">
            <v-text-field
              v-model="keys[i]"
              class="white text-body-1"
              hide-details
              outlined
              dense
              :placeholder="keyLabel"
              @keyup="_handleKeypress"
            />
          </v-col>
          <v-col cols="8" class="pl-3">
            <v-text-field
              v-model="values[i]"
              class="white text-body-1"
              hide-details
              outlined
              dense
              :placeholder="valueLabel"
              @keyup="_handleKeypress"
            />
          </v-col>

          <v-btn
            v-if="i !== 0"
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

      <div class="text-center">
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
</style>
