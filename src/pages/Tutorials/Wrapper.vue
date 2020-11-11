<script>
import { parser } from '@/utils/markdownParser'
const testMd = require('./markdown/test.md')
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
