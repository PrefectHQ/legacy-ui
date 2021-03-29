<script>
/* eslint-disable vue/no-v-html */
export default {
  props: {
    content: {
      type: Object,
      required: true
    },
    dense: {
      type: Boolean,
      required: false,
      default: () => false
    },
    timestamp: {
      type: String,
      required: false,
      default: () => null
    }
  },
  data() {
    return {
      readMore: false
    }
  },
  computed: {
    overflow() {
      return this.content.body?.length > 300
    }
  },
  methods: {
    decodeHTML(str) {
      let textArea = document.createElement('textarea')
      textArea.innerHTML = str
      return textArea.value
    }
  }
}
</script>

<template>
  <v-list-item-content v-if="dense">
    <v-list-item-title>
      <truncate :content="content.title">
        <span
          class="px-2 rounded-pill d-inline-block text-caption white--text codePink"
        >
          New
        </span>
        {{ content.title }}
        <v-icon v-if="content.link" x-small class="ml-1">
          open_in_new
        </v-icon>
      </truncate>
    </v-list-item-title>
    <v-list-item-subtitle v-if="timestamp">
      {{ timestamp }}
    </v-list-item-subtitle>
  </v-list-item-content>

  <v-list-item-content v-else>
    <v-list-item-title>
      <a
        v-if="content.link"
        :href="content.link"
        target="_blank"
        style="display: inline-block;"
      >
        {{ content.title }}
      </a>
      <span v-else>{{ content.title }}</span>
      <v-icon v-if="content.link" x-small class="ml-1">
        open_in_new
      </v-icon>
    </v-list-item-title>

    <v-list-item-subtitle v-if="timestamp">
      {{ timestamp }}
    </v-list-item-subtitle>

    <v-list-item-subtitle v-if="!readMore" v-html="decodeHTML(content.body)">
    </v-list-item-subtitle>

    <v-fade-transition origin="center bottom" hide-on-leave mode="out-in">
      <div
        v-if="overflow && readMore"
        class="subtitle grey--text text--darken-1 pb-4"
        v-html="decodeHTML(content.body)"
      >
      </div>
    </v-fade-transition>
    <span v-if="overflow">
      <a @click="readMore = !readMore">
        Read {{ readMore ? 'less' : 'more' }}
      </a>
    </span>
  </v-list-item-content>
</template>
