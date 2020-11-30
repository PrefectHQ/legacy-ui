<script>
/* eslint-disable vue/no-v-html */

import { artifact_parser } from '@/utils/markdownParser'

export default {
  props: {
    artifact: {
      type: Object,
      required: true
    }
  },
  methods: {
    mdParser(md) {
      let parsed = md.substring(2, md.length - 2)
      //   .replaceAll('\\n', '\n')
      //   let stripped = parsed.replace(/<\s*(\w+).*?>/gm, '<$1>')
      return artifact_parser(parsed)
      //   return parser(parsed)
    }
  }
}
</script>

<template>
  <div>
    <div v-html="mdParser(artifact.data.markdown)"> </div>

    <div>
      {{ artifact.data.markdown }}
    </div>
  </div>
</template>
