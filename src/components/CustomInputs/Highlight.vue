<template>
  <pre>
    <!-- eslint-disable vue/no-v-html -->
    <code :class="classes.code" v-html="html" />
  </pre>
</template>

<script>
import hljs from 'highlight.js/lib/core.js'
import json from 'highlight.js/lib/languages/json'
import yaml from 'highlight.js/lib/languages/yaml'
import { escapeHTML } from '@/utils/html'

export default {
  props: {
    language: {
      type: String,
      required: false,
      default: null,
      validator: value => [null, 'json', 'yaml'].includes(value)
    },
    code: {
      type: String,
      required: false,
      default: null
    },
    autodetect: {
      type: Boolean,
      required: false,
      default: false
    },
    ignoreIllegals: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      detectedLanguage: ''
    }
  },
  computed: {
    classes() {
      return {
        code: 'hljs ' + this.detectedLanguage
      }
    },
    html() {
      if (!this.code) {
        return ''
      }

      if (this.autoDetect || this.language == null) {
        this.tryDetectingLanguage()
      }

      if (this.languageNotSupported) {
        return escapeHTML(this.code)
      }

      const { value } = hljs.highlight(this.code, {
        language: this.language,
        ignoreIllegals: this.ignoreIllegals
      })

      return value
    },
    languageNotSupported() {
      return !hljs.getLanguage(this.language)
    }
  },
  created() {
    hljs.registerLanguage('json', json)
    hljs.registerLanguage('yaml', yaml)
  },
  methods: {
    tryDetectingLanguage() {
      const { language } = hljs.highlightAuto(this.code)

      this.detectedLanguage = language
    }
  }
}
</script>
