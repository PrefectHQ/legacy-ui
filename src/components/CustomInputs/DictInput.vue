<script>
export default {
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
        return {}
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
      inputMode: 'simple',
      keys: [],
      values: []
    }
  },
  computed: {
    pairs() {
      return [...this.keys]
    },
    value() {
      const dict = {}
      this.keys.map((k, i) => (dict[k] = this.values[i]))
      return dict
    }
  },
  methods: {
    addKeyValuePair() {
      this.keys.push(null)
      this.values.push(null)
    },
    removeKeyValuePair(i) {
      this.keys.splice(i, 1)
      this.values.splice(i, 1)
      this.$emit('change', this.value)
    },
    _handleKeypress() {
      this.$emit('change', this.value)
    }
  }
}
</script>

<template>
  <div>
    <div v-if="inputMode == 'json'"></div>
    <div v-else>
      <transition-group name="fade" mode="out-in">
        <v-row
          v-for="(pair, i) in pairs"
          :key="i"
          no-gutters
          align="center"
          class="my-4 position-relative pr-8"
        >
          <v-col cols="4" class="pr-3">
            <v-text-field
              v-model="keys[i]"
              class="white"
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
              class="white"
              hide-details
              outlined
              dense
              :placeholder="valueLabel"
              @keyup="_handleKeypress"
            />
          </v-col>

          <v-btn
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
