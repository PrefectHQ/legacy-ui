export const pollsProjectsMixin = {
  data() {
    return {
      unsubscribe: null
    }
  },
  async created() {
    this.unsubscribe = await this.$store.dispatch(
      'polling/subscribe',
      'projects'
    )
  },
  beforeDestroy() {
    this.unsubscribe()
  }
}
