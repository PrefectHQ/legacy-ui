<script>
// eslint-disable-next-line
const stripe = Stripe(process.env.VUE_APP_STRIPE_PUBLIC_TOKEN)
let elements = stripe.elements()
let card = undefined
let style = {
  iconStyle: 'solid',
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

import LogRocket from 'logrocket'
import { mapGetters, mapActions } from 'vuex'

export default {
  components: {},
  data() {
    return {
      cardError: '',
      address: this.tenant?.stripe_customer?.sources?.data[0]?.owner?.address
        ?.line1,
      email: this.tenant?.stripe_customer?.email,
      name: this.tenant?.stripe_customer?.name,
      loading: false,
      nameRules: [
        v => !!v || 'Name is required',
        v => v?.length <= 80 || 'Name must be less than 80 characters'
      ],
      emailRules: [
        v => !!v || 'E-mail is required',
        v => /.+@.+/.test(v) || 'E-mail must be valid'
      ],
      addressRules: [v => !!v || 'Address is required'],
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
        style: style,
        classes: elementClasses
      })
      card.mount(this.$refs.card)
      this.card = card
    }

    this.email = this.tenant.stripe_customer?.email
    this.name = this.tenant.stripe_customer?.name

    this.address = this.tenant?.stripe_customer?.sources?.data[0]?.owner?.address?.line1
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
          name: this.name,
          email: this.email,
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
              email: this.email,
              name: this.name,
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
        label="Name"
        type="text"
        :value="name"
        required
        validate-on-blur
      >
        <template #prepend-inner>
          <span>
            <v-icon>
              fad fa-smile fa-fw
            </v-icon>
          </span>
        </template>
      </v-text-field>
      <v-text-field
        v-model="email"
        outlined
        :rules="emailRules"
        label="Email"
        type="email"
        required
        validate-on-blur
      >
        <template #prepend-inner>
          <span>
            <v-icon>
              fad fa-envelope fa-fw
            </v-icon>
          </span>
        </template>
      </v-text-field>

      <v-text-field
        v-model="address"
        data-cy="address"
        outlined
        :rules="addressRules"
        label="Address"
        type="text"
        required
        validate-on-blur
      >
        <template #prepend-inner>
          <span>
            <v-icon>
              fad fa-map-marker-alt fa-fw
            </v-icon>
          </span>
        </template>
      </v-text-field>

      <div ref="card"> </div>

      <div class="red--text">
        {{ cardError }}
      </div>
    </v-form>

    <v-btn
      color="prefect"
      class="mt-auto white--text"
      :disabled="loading || !valid"
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
  height: 100% !important;

  form,
  button {
    width: 100%;
  }
}

/*stylelint-disable */
.StripeElement {
  background-color: white;

  height: 56px;
  padding: 15px;
  position: relative;
  transition: box-shadow 150ms ease;

  &:before {
    border: 1px solid rgba(0, 0, 0, 0.42);
    border-radius: 4px;
    content: '';
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    transition: all 50ms;
    user-select: none;
    width: 100%;
  }

  &:hover {
    &:before {
      border-color: #000;
    }
  }
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

.focused {
  &:before {
    border: 2px solid var(--v-primary-base) !important;
  }
}
</style>
