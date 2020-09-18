const konamee = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a'
]

export const eventsMixin = {
  data() {
    return {
      sequence: []
    }
  },
  created() {
    document.addEventListener('keydown', this.handleEvent)
  },
  beforeDestroy() {
    document.removeEventListener('keydown', this.handleEvent)
  },
  methods: {
    checkSequence() {
      for (let i = 0; i < this.sequence.length; ++i) {
        let key = this.sequence[i]
        if (key !== konamee[i]) {
          this.sequence = []
          break
        }

        if (i == konamee.length - 1) {
          this.sequence = []
          this.handleSequenceSuccess()
        }
      }
    },
    handleEvent(e) {
      this.sequence.push(e?.key)
      this.checkSequence()
    },
    handleSequenceSuccess() {
      console.log('success')

      const app = document.getElementById('app')

      app.classList.add('roll')

      setTimeout(() => {
        app.classList.remove('roll')
      }, 5000)
    }
  }
}
