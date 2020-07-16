<script>
/* eslint-disable vue/no-v-html */
import cronstrue from 'cronstrue'

const regex = /([0-9]{1,2}:?[0-9]{0,2})|(?:am|pm|days|day|years|year|weeks|week|hours|hour|minutes|minute|seconds|second|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)/gim

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
      return this.parsedCron.replace(regex, match => {
        return `<span class="primary--text">${match}</span>`
      })
    }
  }
}
</script>

<template>
  <span v-html="highlightedText"></span>
</template>
