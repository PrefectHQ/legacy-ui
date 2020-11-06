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
    <!-- <div v-html="fileMD()"></div> -->
  </div>
</template>
