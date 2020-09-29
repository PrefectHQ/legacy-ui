<script>
export default {
  data() {
    return {
      quotes: [
        "It's the people you meet in this job that really get you down.",
        "It's the people you meet in this job that really get you down.",
        'This will all end in tears, I just know it.',
        "Life? Don't talk to me about life.",
        "Life. Loathe it or ignore it, you can't like it.",
        'Incredible. It’s even worse than I thought it would be.',
        'Don’t pretend you want to talk to me, I know you hate me.',
        'Here I am, brain the size of a planet, and they ask me to talk to you.',
        "Don't feel you have to take any notice of me, please.",
        'I’d give you advice, but you wouldn’t listen. No one ever does.'
      ]
    }
  },
  computed: {
    quote() {
      return this.quotes[Math.floor(Math.random() * this.quotes.length)]
    }
  }
}
</script>

<template>
  <v-list-item>
    <v-list-item-icon>
      <v-icon color="black">{{ '$mr' }}</v-icon>
    </v-list-item-icon>
    <v-list-item-content>
      <v-list-item-title>Marvin says.....</v-list-item-title>
      <v-list-item-subtitle class="id-subtitle">
        {{ quote }}
      </v-list-item-subtitle>
    </v-list-item-content>
  </v-list-item>
</template>

<style lang="scss" scoped>
.id-subtitle {
  font-size: 0.8rem !important;
}

.text--secondary {
  background-color: #123456 !important;
}
</style>
