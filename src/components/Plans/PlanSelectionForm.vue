<script>
import LogRocket from 'logrocket'
import { mapGetters, mapActions } from 'vuex'
import CardDetails from '@/components/Plans/CardDetails'
import ExternalLink from '@/components/ExternalLink'

import { PLANS_2021 } from '@/utils/plans'

export default {
  components: {
    CardDetails,
    ExternalLink
  },
  props: {
    planReference: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      paymentSource: null,
      loading: false,
      step: 'select-card'
    }
  },
  computed: {
    ...mapGetters('license', ['license']),
    ...mapGetters('tenant', ['tenant']),
    plan() {
      return PLANS_2021[this.planReference]
    },
    payments() {
      return this.tenant?.stripe_customer?.sources?.data
    },
    title() {
      let title
      switch (this.step) {
        case 'select-card':
          title = 'Confirm your payment details'
          break
        case 'add-card':
          title = 'Add a new payment method'
          break
        case 'confirm':
          title = 'Summary'
          break
        case 'complete':
          title = ''
          break
        case 'error':
        default:
          title = 'Oops'
          break
      }
      return title
    }
  },
  mounted() {
    this.getTenants()
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapActions('license', ['getLicense']),
    ...mapActions('tenant', ['getTenants']),
    async updatePlan() {
      this.loading = true
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/License/create-usage-based-license.gql'),
          variables: {
            input: {
              tenant_id: this.tenant.id,
              plan_name: this.plan.value
            }
          }
        })
        if (data.create_self_serve_usage_license.id) {
          await this.getLicense()
          await this.getTenants()
        }
      } catch (e) {
        this.error = true
        LogRocket.captureException(e, {
          extra: {
            pageName: 'Plan selection',
            stage: 'Create usage based license'
          }
        })
      } finally {
        this.loading = false
      }
    },
    handleConfirm(sourceId) {
      this.paymentSource = sourceId
      this.setStep('confirm')
    },
    handleNext() {
      if (this.paymentSource == 'new') {
        this.setStep('add-card')
      } else {
        this.setStep('confirm')
      }
    },
    selectPayment(id) {
      this.paymentSource = id
    },
    setStep(step) {
      this.step = step

      if (step == 'select-card') {
        this.getTenants()
      }
    },
    async handleSubmit() {
      await this.updatePlan()
      if (!this.error) {
        this.$emit('complete')
        this.setStep('complete')
      } else {
        this.setStep('error')
      }
    }
  }
}
</script>

<template>
  <div
    class="form-container blue-grey--text text--darken-2 white rounded elevation-8 pa-8"
  >
    <div class="text-h4 font-weight-light">
      {{ title }}
    </div>

    <div key="card-form-container" class="card-container">
      <v-fade-transition mode="out-in">
        <div
          v-if="step == 'add-card'"
          key="add-card"
          class="card-entry-container"
        >
          <div
            class="d-inline-block text-subtitle-1 font-weight-light mx-auto cursor-pointer mt-4 h-auto"
            @click="setStep('select-card')"
          >
            <v-icon color="blue-grey">chevron_left</v-icon>
            Choose an existing method instead
          </div>

          <div style="height: 559px;">
            <CardDetails @confirm="handleConfirm" />
          </div>
        </div>

        <div
          v-else-if="step == 'select-card'"
          key="select-card"
          class="card-selection d-flex align-center justify-center flex-column"
        >
          <div
            class="card-display mt-auto"
            :class="{ active: paymentSource == 'new' }"
            @click.stop="selectPayment('new')"
          >
            <div class="text-h6 font-weight-light">
              Add new card
            </div>
          </div>

          <div
            v-if="payments && payments.length"
            class="card-or text-center my-8"
          >
            <div class="d-inline-block position-relative white py-2 px-8">
              OR
            </div>
          </div>

          <div
            v-for="payment in payments"
            :key="payment.id"
            :class="{ active: paymentSource == payment.id }"
            class="card-display mb-auto d-flex align-center justify--start"
            @click="selectPayment(payment.id)"
          >
            <div v-if="payment.type == 'card'">
              <div class="mb-auto d-flex align-center justify--start">
                <div>
                  <div v-if="payment.owner" class="text-h5 font-weight-light">
                    {{ payment.owner.name }}
                  </div>
                  <div v-if="payment.card" class="mt-1">
                    <div class="text-subtitle-1">
                      {{ payment.brand || payment.card.brand }}
                    </div>

                    <div class="mt-n2">
                      <span class="text-h6 font-weight-regular">
                        •••• •••• •••• {{ payment.last4 || payment.card.last4 }}
                      </span>
                      <span
                        v-if="payment.exp_month || payment.card"
                        class="ml-1 text-subtitle-1 font-weight-light"
                      >
                        {{ payment.exp_month || payment.card.exp_month }}/{{
                          payment.exp_year || payment.card.exp_year
                        }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="payment.type == 'ach_credit_transfer'">
              <div class="mb-auto d-flex align-center justify--start">
                <div>
                  <div v-if="payment.owner" class="text-h5 font-weight-light">
                    {{ payment.owner.name }}
                  </div>
                  <div class="mt-1">
                    <div class="text-subtitle-1">
                      {{ payment.ach_credit_transfer.bank_name }}
                    </div>

                    <div class="mt-n2">
                      <div class="text-h6 font-weight-regular">
                        ••••••••••••
                        {{
                          payment.ach_credit_transfer.account_number &&
                            payment.ach_credit_transfer.account_number.substring(
                              payment.ach_credit_transfer.account_number
                                .length - 4
                            )
                        }}
                      </div>
                      <div class="text-subtitle-1 font-weight-light">
                        ••••••••••••
                        {{
                          payment.ach_credit_transfer.routing_number &&
                            payment.ach_credit_transfer.routing_number.substring(
                              payment.ach_credit_transfer.routing_number
                                .length - 4
                            )
                        }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="payment.type == 'ach_debit'">
              <div class="mb-auto d-flex align-center justify--start">
                <div v-if="payment.owner" class="text-h5 font-weight-light">
                  {{ payment.owner.name }}
                </div>

                <div class="mt-1">
                  <div class="text-subtitle-1">
                    {{ payment.ach_debit.bank_name }}
                  </div>

                  <div class="mt-n2">
                    <div
                      v-if="payment.ach_debit.account_number"
                      class="text-h6 font-weight-regular"
                    >
                      ••••••••••••
                      {{
                        payment.ach_debit.account_number.substring(
                          payment.ach_debit.account_number.length - 4
                        )
                      }}
                    </div>
                    <div
                      v-if="payment.ach_debit.routing_number"
                      class="text-subtitle-1 font-weight-light"
                    >
                      ••••••••••••
                      {{
                        payment.ach_debit.routing_number.substring(
                          payment.ach_debit.routing_number.length - 4
                        )
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="payment.type == 'card' && payment.card" class="ml-auto">
              <v-icon large>
                fab fa-cc-{{ payment.card.brand.toLowerCase() }}
              </v-icon>
            </div>

            <div
              v-else-if="
                payment.type == 'ach_debit' ||
                  payment.type == 'ach_credit_transfer'
              "
              class="ml-auto"
            >
              <v-icon large>
                fad fa-university
              </v-icon>
            </div>
          </div>

          <v-btn
            color="prefect"
            class="mt-auto white--text"
            :disabled="loading || !paymentSource"
            :loading="loading"
            style="width: 100%;"
            data-cy="next"
            @click="handleNext"
          >
            Next
          </v-btn>
        </div>

        <div
          v-else-if="step == 'confirm'"
          key="confirm"
          class="confirm-container d-flex align-start justify-center flex-column"
        >
          <div
            class="d-inline-block text-subtitle-1 font-weight-light cursor-pointer mt-4 h-auto"
            @click="setStep('select-card')"
          >
            <v-icon color="blue-grey">chevron_left</v-icon>
            Change payment method
          </div>

          <div class="text-left mt-auto w-100">
            <div
              class="text-h4 font-weight-light d-flex align-end justify-start"
            >
              <span>Plan</span>
              <span class="flex-grow-1 dotted-line mx-2 mb-1" />
              <span class="text-subtitle-1 ml-auto white--text plan-title">
                {{ plan.name }}
              </span>
            </div>
            <div class="mt-4 text-h6 font-weight-light">
              <div class="mt-4 d-flex align-end justify-start">
                <span>Users</span>
                <span class="flex-grow-1 dotted-line mx-2 mb-1" />
                <span class="mr-3 font-weight-regular">
                  {{ plan.users }}
                </span>
                <span class="plans-feature-icon align-self-center">
                  <v-icon small>
                    fad fa-users fa-fw
                  </v-icon>
                </span>
              </div>

              <div class="mt-6 d-flex align-end justify-start">
                <span>Run history</span>
                <span class="flex-grow-1 dotted-line mx-2 mb-1" />
                <span class="mr-3 font-weight-regular">
                  1 {{ plan.history }}
                </span>
                <span class="plans-feature-icon align-self-center">
                  <v-icon small>
                    fad fa-history fa-fw
                  </v-icon>
                </span>
              </div>

              <div
                v-if="plan.taskRuns"
                class="mt-6 d-flex align-end justify-start"
              >
                <span>Free runs</span>
                <span class="flex-grow-1 dotted-line mx-2 mb-1" />
                <span class="mr-3 font-weight-regular text-right mb-n2">
                  <span>
                    {{ plan.taskRuns.toLocaleString() }}
                    <div class="text-caption mt-n2">
                      / month
                    </div>
                  </span>
                </span>

                <span class="plans-feature-icon align-self-center">
                  <v-icon small>
                    fad fa-lightbulb fa-fw
                  </v-icon>
                </span>
              </div>

              <div
                v-if="plan.price"
                class="mt-6 d-flex align-end justify-start"
              >
                <span>Price per additional run</span>
                <span class="flex-grow-1 dotted-line mx-2 mb-1" />
                <span class="mr-3 font-weight-regular text-right mb-n2">
                  <span>
                    ${{ plan.price }}
                    <div class="text-caption mt-n2">
                      / successful task run
                    </div>
                  </span>
                </span>

                <span class="plans-feature-icon align-self-center">
                  <v-icon small>
                    fad fa-tasks fa-fw
                  </v-icon>
                </span>
              </div>

              <div
                class="mt-6 font-weight-light d-flex align-end justify-start"
              >
                <span>Volume discounts</span>
                <span class="flex-grow-1 mx-2 mb-1 dotted-line" />
                <span class="mr-3 font-weight-regular mb-n2"
                  >Automatic
                  <div class="text-caption mt-n2">
                    applied monthly
                  </div>
                </span>
                <span
                  class="plans-feature-icon feature-green align-self-center"
                >
                  <v-icon small>
                    fad fa-check fa-fw
                  </v-icon>
                </span>
              </div>
            </div>
          </div>

          <div class="mt-8 text-h5 font-weight-light text-right w-100">
            Due today:
            <span class="font-weight-medium"
              >${{ plan.additionalCost ? plan.additionalCost : '0.00' }}</span
            >
          </div>

          <v-btn
            color="prefect"
            class="mt-auto white--text w-100"
            :disabled="loading || !paymentSource"
            :loading="loading"
            data-cy="finish"
            @click="handleSubmit"
          >
            Finish
          </v-btn>

          <div class="text-caption mb-n4 mt-2 mx-auto">
            By clicking finish, you assert that you have read & agree to the
            <ExternalLink
              href="https://www.prefect.io/legal/terms-and-conditions"
              >Terms & Conditions</ExternalLink
            >
          </div>
        </div>

        <div
          v-else-if="step == 'complete'"
          key="complete"
          class="complete-container d-flex align-start justify-center flex-column"
        >
          <div class="mt-auto text-h4 font-weight-light w-100 text-center">
            You're all set - happy engineering!
            <img
              class="mt-8 mx-auto"
              src="@/assets/backgrounds/your-flow-runs.svg"
              alt="You're all set image"
            />
          </div>

          <v-btn
            color="prefect"
            class="mt-auto white--text w-100"
            :href="`/${tenant.slug}`"
          >
            Go to the dashboard
          </v-btn>
        </div>

        <div v-else key="error" class="error-container">
          Something went wrong...
        </div>
      </v-fade-transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.form-container {
  height: min-content;
  max-width: 600px;
  overflow: hidden;
  transition: max-height 150ms;
  width: 600px;
}

.form-actions {
  min-height: 36px;
}

.h-auto {
  height: auto !important;
}

.card-container {
  position: relative;
  transition: all 150ms;

  .card-selection {
    min-height: 600px;
  }

  .card-display {
    border: 2px solid #efefef;
    border-radius: 4px;
    box-sizing: content-box;
    cursor: pointer;
    height: auto;
    padding: 24px 24px 24px 48px;
    position: relative;
    text-align: left;
    transition: all 50ms;
    user-select: none;
    width: 400px;

    &.active {
      border: 2px solid var(--v-primary-base);

      &::before {
        border-color: var(--v-primary-base);
      }

      &::after {
        background-color: var(--v-primary-base);
        border-radius: 50%;
        height: 10px;
        left: 17px;
        width: 10px;
      }
    }

    &::after,
    &::before {
      box-sizing: border-box;
      content: '';
      position: absolute;
      top: 50%;
      transform: translate(0, -50%);
      transition: all 150ms;
    }

    &::after {
      border-radius: 0;
      height: 0;
      left: 22px;
      width: 0;
    }

    &::before {
      border: 2px solid #eee;
      border-radius: 50%;
      height: 20px;
      left: 12px;
      width: 20px;
    }
  }

  .card-or {
    position: relative;
    width: 100%;

    &::before {
      background-color: #eee;
      content: '';
      height: 1px;
      left: 0;
      position: absolute;
      top: 50%;
      transform: translate(0, -50%);
      width: 100%;
    }
  }
}

.confirm-container,
.complete-container,
.error-container,
.card-entry-container {
  min-height: 600px;
}

.dotted-line {
  border-top: 2px dotted #eee;
}

.h-100 {
  height: 100%;
}

.w-100 {
  width: 100%;
}

.theme--light.v-subheader {
  color: #000;
  font-weight: bold !important;
}

.checkbox-container {
  margin-left: 30px;
  margin-top: -20px;
}
/* stylelint-disable */
.set-state .v-btn__loader {
  color: #fff;
}

.card-title {
  margin-left: -12px;
  margin-top: -10px;
  margin-bottom: 10px;
}

.plan-title {
  background-color: var(--v-primary-base);
  border-radius: 6px;
  letter-spacing: 0.15rem;
  padding: 0 8px;
  text-transform: uppercase;
}
</style>
