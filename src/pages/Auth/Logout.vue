<script>
import { mapActions } from 'vuex'

const quotes = [
  'The first ten million years were the worst," said Marvin, "and the second ten million years, they were the worst too. The third ten million years I didn\'t enjoy at all. After that I went into a bit of a decline.',
  "Sorry, did I say something wrong? Pardon me for breathing, which I never do anyway so I don't know why I bother to say it.",
  "It's part of the shape of the Universe. I only have to talk to somebody and they begin to hate me.",
  '"Don\'t blame you," said Marvin and counted five hundred and ninety-seven thousand million sheep before falling asleep again a second later.',
  "Having solved all the major mathematical, physical, chemical, biological, sociological, philosophical, etymological, meteorological and psychological problems of the Universe except for his own, three times over, [Marvin] was severely stuck for something to do, and had taken up composing short dolorous ditties of no tone, or indeed tune. The latest one was a lullaby. Marvin droned, Now the world has gone to bed, Darkness won't engulf my head, I can see in infrared, How I hate the night. He paused to gather the artistic and emotional strength to tackle the next verse. Now I lay me down to sleep, Try to count electric sheep, Sweet dream wishes you can keep, How I hate the night."
]

export default {
  data() {
    return {
      redirecting: false,
      quote: quotes[Math.floor(Math.random() * quotes.length)]
    }
  },
  methods: {
    ...mapActions('auth', ['login']),
    redirectToLogin() {
      this.redirecting = true
      setTimeout(() => {
        this.login()
      }, 1500)
    }
  }
}
</script>

<template>
  <v-container
    class="d-flex flex-column align-center justify-center text-h4 h-100"
  >
    <div>
      You're now signed out.
    </div>
    <div class="d-flex align-center justify-center">
      <i class="fad fa-quote-left" />
      <blockquote class="blockquote body-1 text--secondary">
        {{ quote }}
      </blockquote>
    </div>
    <v-btn
      color="prefect"
      dark
      class="mt-8"
      large
      :loading="redirecting"
      @click="redirectToLogin"
    >
      Sign In
    </v-btn>
  </v-container>
</template>

<style lang="scss" scoped>
.h-100 {
  height: 100vh;
}

.blockquote {
  max-width: 600px;
}
</style>
