<script>
import { parser, mdParser } from '@/utils/markdownParser'
export default {
  methods: {
    fileMD() {
      return parser(require(`./Markdown/${this.$route.name}.md`))
    },
    otherMD() {
      return mdParser(require(`./Markdown/${this.$route.name}.md`)).contents
    }
  }
}
</script>

<template>
  <div>
    <div v-html="otherMD()"></div>
  </div>
</template>
