<script>
// eslint-disable-next-line
const stripe = Stripe(process.env.VUE_APP_STRIPE_PUBLIC_TOKEN)
let elements = stripe.elements()
let card = undefined
let style = {
  iconStyle: 'Solid',
  base: {
    outlineStyle: 'solid',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    iconColor: '#aaa',
    '::placeholder': {
      color: '#767676'
    }
  },
  invalid: {
    color: '#fa755a',
    iconColor: '#fa755a'
  }
}

const elementClasses = {
  focus: 'focused',
  empty: 'empty',
  invalid: 'invalid'
}

import { teamProfileMixin } from '@/mixins/teamProfileMixin.js'
import { paymentMixin } from '@/mixins/paymentMixin.js'
import LogRocket from 'logrocket'
import { mapGetters, mapActions } from 'vuex'

export default {
  components: {},
  mixins: [teamProfileMixin, paymentMixin],
  data() {
    return {
      nameRules: [
        v => !!v || 'Name is required',
        v => v.length <= 20 || 'Name must be less than 20 characters'
      ],
      emailRules: [
        v => !!v || 'E-mail is required',
        v => /.+@.+/.test(v) || 'E-mail must be valid'
      ],
      valid: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('license', ['license']),
    ...mapGetters('user', ['user']),
    disabled() {
      return !this.valid
    }
  },
  mounted() {
    if (!card) {
      card = elements.create('card', {
        iconStyle: 'solid',
        style: style,
        classes: elementClasses
      })
      card.mount(this.$refs.card)
      this.card = card
    }
  },
  destroyed() {
    // if (card) card.unmount()
  },
  updated() {
    if (card) card.mount(this.$refs.card)
  },
  methods: {
    ...mapActions('license', ['getLicense']),
    ...mapActions('alert', ['setAlert']),
    ...mapActions('tenant', ['getTenants']),
    ...mapActions('user', ['getUser']),
    async checkForm() {
      const options = {
        owner: {
          name: this.updatedName || this.username,
          email: this.updatedEmail || this.email,
          address: {
            line1: this.address
          }
        },
        usage: 'reusable'
      }
      const result = await stripe.createSource(card, options)
      if (result.error) {
        // Inform the user if there was an error
        this.cardError = result.error.message
        this.loading = false
        return
      } else {
        this.source = result.source
        return true
      }
    },
    async confirm() {
      this.loading = true
      try {
        const continueAdding = await this.checkForm()
        if (continueAdding) {
          const customer = await this.$apollo.mutate({
            mutation: require('@/graphql/License/update-customer.gql'),
            variables: {
              email: this.updatedEmail || this.email,
              name: this.updatedName || this.username,
              source: this.source ? this.source.id : null
            },
            errorPolicy: 'all'
          })
          if (!customer.data.update_stripe_customer.id) {
            this.loading = false
            this.cardError = customer.errors[0].message
          }

          this.$emit('confirm', this.source.id)
        }
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'payment card',
            stage: 'update stripe customer'
          }
        })
        this.loading = false
        this.cardError = 'There was a problem adding your card information.'
      }
    }
  }
}
</script>

<template>
  <div class="card-form d-flex align-center justify-center flex-column">
    <v-form v-model="valid" class="my-auto">
      <v-text-field
        v-model="name"
        data-cy="full-name"
        outlined
        :rules="nameRules"
        class="mt-3"
        prepend-inner-icon="fad fa-smile fa-fw"
        label="Name"
        type="text"
        required
      ></v-text-field>
      <v-text-field
        v-model="email"
        outlined
        :rules="emailRules"
        prepend-inner-icon="fad fa-envelope fa-fw"
        label="Email"
        type="email"
        default="this.user.email"
        required
      ></v-text-field>
      <v-text-field
        v-model="address"
        data-cy="address"
        outlined
        prepend-inner-icon="fad fa-map-marker-alt fa-fw"
        label="Address"
        type="text"
        required
      ></v-text-field>

      <div ref="card"> </div>

      <div class="red--text">
        {{ cardError }}
      </div>
    </v-form>

    <v-btn
      color="prefect"
      class="mt-auto white--text"
      :disabled="loading"
      :loading="loading"
      data-cy="save-payment"
      @click="confirm"
    >
      {{ loading ? 'Submitting' : 'Confirm' }}
    </v-btn>
  </div>
</template>

<style lang="scss" scoped>
.card-form {
  height: 559px !important;

  form,
  button {
    width: 100%;
  }
}

/*stylelint-disable */
.StripeElement {
  background-color: white;
  border: 1px solid;
  border-color: #0009;
  border-radius: 4px;
  height: 56px;

  padding: 15px;
  -webkit-transition: box-shadow 150ms ease;
  transition: box-shadow 150ms ease;
}

.StripeElement--focus {
  box-shadow: 0 1px 3px 0 #cfd7df;
}

.StripeElement--invalid {
  border-color: #fa755a;
}

.StripeElement--webkit-autofill {
  background-color: #fefde5 !important;
}
</style>
