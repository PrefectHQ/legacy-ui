<script>
import { parser } from '@/utils/markdownParser'
export default {
  methods: {
    fileMD() {
      return parser(require(`./Markdown/${this.$route.name}.md`))
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
