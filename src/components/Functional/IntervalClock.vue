<script>
/* eslint-disable vue/no-v-html */
import { intervalToEnglish } from '@/utils/dateTime'
import { PARSED_SCHEDULE_REGEX } from '@/utils/regEx'

export default {
  props: {
    interval: {
      type: [String, Number],
      required: true
    }
  },
  computed: {
    parsedInterval() {
      return intervalToEnglish(Number(this.interval) * 0.001)
    }
  },
  methods: {
    generateHighlightedText(string) {
      return string.replace(PARSED_SCHEDULE_REGEX, match => {
        return `<span class="primary--text">${match}</span>`
      })
    }
  }
}
</script>

<template>
  <span v-html="`${generateHighlightedText(parsedInterval)}`"></span>
</template>
