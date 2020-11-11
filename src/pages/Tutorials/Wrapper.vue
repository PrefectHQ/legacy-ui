<script>
import { parser } from '@/utils/markdownParser'
const testMd = require('./Markdown/test.md')
export default {
  methods: {
    fileMD() {
      return parser(testMd)
    }
  }
}
</script>

<template>
  <div>
    <h1>Route: {{ this.$route.name }}</h1>
    <div v-html="fileMD()"></div>
  </div>
</template>
