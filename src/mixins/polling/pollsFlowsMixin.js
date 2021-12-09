export const pollsFlowsMixin = {
  data() {
    return {
      unsubscribe: null
    }
  },
  async created() {
    this.unsubscribe = await this.$store.dispatch('polling/subscribe', 'flows')
  },
  beforeDestroy() {
    this.unsubscribe()
  }
}
