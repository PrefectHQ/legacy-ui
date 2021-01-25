<script>
/* eslint-disable vue/no-v-html */
import cronstrue from 'cronstrue'
import moment from 'moment-timezone'
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
    },
    timezone: {
      type: String,
      required: false,
      default: null
    }
  },
  computed: {
    parsedCron() {
      return cronstrue.toString(this.cron, { verbose: this.verbose })
    },
    timezoneAbbr() {
      return moment()
        .tz(this.timezone)
        .zoneAbbr()
    },
    highlightedText() {
      if (!this.parsedCron) return ''
      if (this.timezone) {
        return this.parsedCron
          .replace(PARSED_SCHEDULE_REGEX, match => {
            return `<span class="primary--text">${match}</span>`
          })
          .concat(`<span class="primary--text"> (${this.timezoneAbbr})</span>`)
      } else {
        return this.parsedCron.replace(PARSED_SCHEDULE_REGEX, match => {
          return `<span class="primary--text">${match}</span>`
        })
      }
    }
  }
}
</script>

<template>
  <span v-html="highlightedText"></span>
</template>
