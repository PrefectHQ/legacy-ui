<script>
// eslint-disable-next-line
const stripe = Stripe(process.env.VUE_APP_STRIPE_PUBLIC_TOKEN)
let elements = stripe.elements()
let card = undefined
const computedStyle = getComputedStyle(document.body)
let style = {
  iconStyle: 'Solid',
  base: {
    outlineStyle: 'solid',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    iconColor: computedStyle.getPropertyValue('--v-utilGrayMid-base'),
    '::placeholder': {
      color: computedStyle.getPropertyValue('--v-utilGrayMid-base')
    }
  },
  invalid: {
    color: computedStyle.getPropertyValue('--v-accentOrange-base'),
    iconColor: computedStyle.getPropertyValue('--v-accentOrange-base')
  },
  focus: {
    iconColor: computedStyle.getPropertyValue('--v-primary-base'),
    borderColor: computedStyle.getPropertyValue('--v-primary-base')
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
  props: {
    desiredUsers: {
      type: Number,
      required: false,
      default: 0
    },
    diff: {
      type: Number,
      required: false,
      default: 0
    },
    updateCard: {
      type: Boolean,
      required: true
    },
    updateUsers: {
      type: Boolean,
      required: true
    }
  },
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
    ...mapGetters('license', ['license', 'planType']),
    ...mapGetters('user', ['user']),
    disableButton() {
      if (this.updateUsers)
        return this.diff === 0 || (this.showPayment && !this.valid)
      return !this.valid
    },
    showPayment() {
      if (!this.existingCard || this.updateCard) return true
      return false
    }
  },
  mounted() {
    if (!card) {
      card = elements.create('card', {
        iconStyle: 'solid',
        style: style,
        classes: elementClasses
      })
      if (this.updateCard) card.mount(this.$refs.card)
      this.card = card
    }
  },
  beforeDestroy() {
    if (card) card.unmount()
  },
  updated() {
    if (card && this.updateCard) card.mount(this.$refs.card)
  },
  methods: {
    ...mapActions('license', ['getLicense']),
    ...mapActions('alert', ['setAlert']),
    ...mapActions('tenant', ['getTenants']),
    ...mapActions('user', ['getUser']),
    async checkForm() {
      const options = {
        owner: {
          address: {
            line1: this.updatedAddress ? this.updatedAddress : this.address
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
    async confirmAdd() {
      this.loading = true
      try {
        const continueAdding = await this.checkForm()
        if (continueAdding) {
          const customer = await this.$apollo.mutate({
            mutation: require('@/graphql/License/update-customer.gql'),
            variables: {
              email: this.updatedEmail ? this.updatedEmail : this.email,
              name: this.updatedName ? this.updatedName : this.username,
              source: this.source ? this.source.id : null
            },
            errorPolicy: 'all'
          })
          if (customer.data.update_stripe_customer.id) {
            if (this.planType('FREE')) {
              await this.$apollo.mutate({
                mutation: require('@/graphql/License/create-usage-based-license.gql'),
                variables: {
                  input: {
                    tenant_id: this.tenant.id,
                    plan_name: 'STARTER_2021'
                  }
                }
              })
            }
            this.setAlert({
              alertShow: true,
              alertMessage: 'Payment details updated.',
              alertType: 'Success'
            })
            this.reset()
          } else {
            this.loading = false
            this.cardError = customer.errors[0].message
          }
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
    },
    async reset() {
      this.$emit('close')
      this.email = null
      this.address = null
      this.cardError = null
      this.username = null

      await this.getUser()

      const tenantSlug = this.user.memberships.filter(
        membership => membership.tenant.id === this.tenant.id
      )?.tenant?.slug

      if (tenantSlug) {
        await this.setCurrentTenant(tenantSlug)
      }
      this.loading = false
    }
  }
}
</script>

<template>
  <div>
    <v-card-text>
      <v-form v-if="showPayment" v-model="valid">
        <v-text-field
          v-model="username"
          data-cy="full-name"
          outlined
          :rules="nameRules"
          class="mt-3"
          prepend-inner-icon="face"
          label="Full Name"
          type="text"
          required
        ></v-text-field>
        <v-text-field
          v-model="email"
          outlined
          :rules="emailRules"
          prepend-inner-icon="email"
          label="Email"
          type="email"
          default="this.user.email"
          required
        ></v-text-field>
        <v-text-field
          v-model="address"
          data-cy="address"
          outlined
          prepend-inner-icon="home"
          label="Address"
          type="text"
          required
        ></v-text-field>

        <div ref="card"> </div>

        <div class="red--text">
          {{ cardError }}
        </div>
      </v-form>
    </v-card-text>
    <v-card-actions v-if="permissionsCheck">
      <v-spacer></v-spacer>
      <v-btn text @click="reset">Cancel</v-btn>
      <v-btn
        v-if="updateUsers"
        color="primary"
        :disabled="disableButton"
        :loading="loading"
        @click="confirmAdd"
        >{{ upgradeOrDowngrade }}</v-btn
      >
      <v-btn
        v-else
        color="primary"
        :disabled="disableButton"
        :loading="loading"
        data-cy="save-payment"
        @click="confirmAdd"
        >Update</v-btn
      >
    </v-card-actions>
  </div>
</template>

<style scoped>
/*stylelint-disable */
.StripeElement {
  border: 1px solid;
  border-radius: 4px;
  height: 56px;

  padding: 15px;
}

.StripeElement.focused {
  border-color: var(--v-primary-base);
  border-width: 2px;
}

.StripeElement.invalid {
  border-color: var(--v-accentOrange-base);
}

.StripeElement.webkit-autofill {
  background-color: var(--v-Queued-base) !important;
}
</style>
