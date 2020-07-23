<script>
/* eslint-disable vue/no-v-html */
import cronstrue from 'cronstrue'
import { PARSED_SCHEDULE_REGEX } from '@/utils/regEx'

export default {
  props: {
    cron: {
      type: String,
      required: true
    },
    verbose: {
      type: Boolean,
      required: false,
      default: () => false
    }
  },
  computed: {
    parsedCron() {
      return cronstrue.toString(this.cron, { verbose: this.verbose })
    },
    highlightedText() {
      if (!this.parsedCron) return ''
      return this.parsedCron.replace(PARSED_SCHEDULE_REGEX, match => {
        return `<span class="primary--text">${match}</span>`
      })
    }
  }
}
</script>

<template>
  <span v-html="highlightedText"></span>
</template>
