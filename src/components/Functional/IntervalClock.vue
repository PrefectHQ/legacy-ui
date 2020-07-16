<script>
const regex = /([0-9]{1,2}:?[0-9]{0,2})|(?:am|pm|days|day|years|year|weeks|week|hours|hour|minutes|minute|seconds|second|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)/gim

/* eslint-disable vue/no-v-html */
import { intervalToEnglish } from '@/utils/dateTime'

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
      return string.replace(regex, match => {
        return `<span class="primary--text">${match}</span>`
      })
    }
  }
}
</script>

<template>
  <span v-html="`${generateHighlightedText(parsedInterval)}`"></span>
</template>
