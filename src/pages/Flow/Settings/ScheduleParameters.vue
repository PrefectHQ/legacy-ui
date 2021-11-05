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
    />
  </resettable-wrapper>
</template>

<script>
import ResettableWrapper from '@/components/CustomInputs/ResettableWrapper'
import CodeInput from '@/components/CustomInputs/CodeInput'

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
    }
  }
}
</script>
