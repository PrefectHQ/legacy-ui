<template>
  <base-code-textarea
    ref="editor"
    v-model="internalValue"
    :readonly="readonly"
    :placeholder="placeholder"
    :get-errors="getJsonErrors"
    :format="tryFormatJson"
    :parse="tryParseJson"
    language="json"
  />
</template>

<script>
import BaseCodeTextarea from '@/components/CustomInputs/BaseCodeTextarea'
import { tryParseJson, parseJson, tryFormatJson } from '@/utils/json'

export default {
  name: 'JsonInput',
  components: {
    BaseCodeTextarea
  },
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
    placeholder: {
      type: String,
      required: false,
      default: null
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
    }
  },
  methods: {
    validate() {
      return this.$refs.editor.validate(this.internalValue)
    },
    getJsonErrors(value) {
      if (value == '') {
        return []
      }

      try {
        parseJson(value)
        return []
      } catch (e) {
        return [e.toString()]
      }
    },
    tryParseJson,
    tryFormatJson
  }
}
</script>
