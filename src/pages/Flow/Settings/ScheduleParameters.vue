<template>
  <resettable-wrapper
    :value="internalValue"
    class="resettable-dictionary-json"
    @input="reset"
  >
    <code-input
      v-model="internalValue"
      :editors="['dict', 'json']"
      :entries.sync="internalEntries"
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
    entries: {
      type: String,
      required: false,
      default: null
    }
  },
  data() {
    return {
      internalEntries: null
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
  created() {
    this.internalEntries = this.entries
  },
  methods: {
    reset(value) {
      this.internalValue = value
      this.internalEntries = this.entries
    }
  }
}
</script>
