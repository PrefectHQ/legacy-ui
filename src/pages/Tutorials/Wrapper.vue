<script>
/* eslint-disable vue/no-v-html */

import { parser } from '@/utils/markdownParser'
const testMd = require('./Markdown/Test.md')
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
    <div v-html="fileMD()"></div>
  </div>
</template>
