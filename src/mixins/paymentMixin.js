import { mapGetters } from 'vuex'

export const paymentMixin = {
  props: {},
  data() {
    return {
      cardError: '',
      updatedEmail: null,
      updatedAddress: null,
      updatedName: null,
      loading: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('license', ['license']),
    ...mapGetters('user', ['user']),
    email: {
      get() {
        return this.tenant.stripe_customer?.email
      },
      set(x) {
        this.updatedEmail = x
      }
    },
    address: {
      get() {
        return this.tenant?.stripe_customer?.sources?.data[0]?.owner?.address
          ?.line1
      },
      set(x) {
        this.updatedAddress = x
      }
    },
    username: {
      get() {
        //stripe_customer returns empty customer name as string 'nullnull' so need to explicitly check for that
        if (this.tenant?.stripe_customer?.name == 'nullnull') return ''
        return this.tenant?.stripe_customer?.name
          ? this.tenant?.stripe_customer?.name
          : ''
      },
      set(x) {
        this.updatedName = x
      }
    }
  },
  methods: {}
}
