export const pollsTenantsMixin = {
  data() {
    return {
      unsubscribe: null
    }
  },
  async created() {
    this.unsubscribe = await this.$store.dispatch(
      'polling/subscribe',
      'tenants'
    )
  },
  beforeDestroy() {
    this.unsubscribe()
  }
}
