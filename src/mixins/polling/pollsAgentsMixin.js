export const pollsAgentsMixin = {
  data() {
    return {
      unsubscribe: null
    }
  },
  async created() {
    this.unsubscribe = await this.$store.dispatch('polling/subscribe', 'agents')
  },
  beforeDestroy() {
    this.unsubscribe()
  }
}
