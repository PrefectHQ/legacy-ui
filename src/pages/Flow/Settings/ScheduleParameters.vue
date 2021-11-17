<template>
  <resettable-wrapper
    :value="internalValue"
    class="resettable-dictionary-json"
    @input="reset"
  >
    <code-input
      v-model="internalValue"
      :editors="['dict', 'json']"
      :checked.sync="internalChecked"
      show-checkboxes
      show-types
      readonly-key
      disable-add
      disable-remove
      @input="autoCheckOnEdit"
    />
  </resettable-wrapper>
</template>

<script>
import ResettableWrapper from '@/components/CustomInputs/ResettableWrapper'
import CodeInput from '@/components/CustomInputs/CodeInput'
import { tryParseJson } from '@/utils/json'

export default {
  name: 'ScheduleParameter',
  components: {
    ResettableWrapper,
    CodeInput
  },
  props: {
    value: {
      type: String,
      required: false,
      default: null
    },
    checked: {
      type: Array,
      required: false,
      default: () => []
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
    internalChecked: {
      get() {
        return this.checked
      },
      set(value) {
        this.$emit('update:checked', value)
      }
    }
  },
  methods: {
    reset(value) {
      this.internalValue = value
      this.internalChecked = []
    },
    addKeyToChecked(key) {
      if (!this.internalChecked.includes(key)) {
        this.internalChecked.push(key)
      }
    },
    autoCheckOnEdit(updated) {
      const updatedObject = tryParseJson(updated) || {}
      const previousObject = tryParseJson(this.value) || {}

      const keysThatChanged = Object.entries(updatedObject)
        .filter(([key, value]) => value !== previousObject[key])
        .map(([key]) => key)

      keysThatChanged.forEach(this.addKeyToChecked)
    }
  }
}
</script>
