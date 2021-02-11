<script>
import { mapGetters, mapActions, mapMutations } from 'vuex'
import CardDetails from '@/components/Plans/CardDetails'

import { PLANS_2021 } from '@/utils/plans'

export default {
  components: {
    CardDetails
  },
  props: {
    planReference: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      cardSource: null,
      loading: false,
      previousHeight: 0,
      showCardForm: false
    }
  },
  computed: {
    ...mapGetters('license', ['license']),
    ...mapGetters('tenant', ['tenant']),
    existingCard() {
      console.log(this.tenant.stripe_customer)
      return this.tenant?.stripe_customer?.sources?.data[0]?.card
    },
    cards() {
      return this.tenant?.stripe_customer?.sources?.data
    },
    isSelfServe() {
      return (
        this.license?.terms?.plan === 'SELF_SERVE' ||
        this.license?.terms?.is_self_serve
      )
    },
    planName() {
      return this.plan?.name
    },
    planCost() {
      return this.plan?.price
    },
    plan() {
      return PLANS_2021[this.planReference]
    },
    additionalCost() {
      return this.plan?.additionalCost
    },
    limit() {
      return this.plan.taskRuns
    },
    disableChangePlan() {
      const type = this.tempPlanName || this.license?.terms?.plan
      const planName = type === 'STARTER_2021' ? 'FREE_2021' : type
      return (
        !this.isTenantAdmin || !this.isSelfServe || this.plan.value === planName
      )
    }
  },
  methods: {
    ...mapActions('alert', ['setAlert']),
    ...mapActions('license', ['getLicense']),
    ...mapMutations('license', ['setTempLicenseType']),
    async changePlan() {
      const planvalue =
        this.plan.value === 'FREE_2021' && this.existingCard
          ? 'STARTER_2021'
          : this.plan.value
      this.loading = true
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/License/create-usage-based-license.gql'),
          variables: {
            input: {
              tenant_id: this.tenant.id,
              plan_name: planvalue
            }
          }
        })
        if (data.create_usage_license.id) {
          this.alertMessage = {
            alertShow: true,
            alertMessage: `You are now on the Prefect ${this.planName} plan`,
            alertType: 'success'
          }
          this.setTempLicenseType(planvalue)
          this.$emit('update', this.plan.value)
          this.tempPlanName = planvalue
        }
      } catch (e) {
        this.alertMessage = {
          alertShow: true,
          alertMessage:
            'There was a problem updating your license.  Please try again or contact help@prefect.io',
          alertType: 'error'
        }
      } finally {
        this.setAlert(this.alertMessage)
        this.loading = false
        this.changePlanDialog = false
      }
    },
    handleConfirm() {
      console.log('confirming')
    },
    handleNext() {
      if (this.cardSource == 'new') {
        this.showCardForm = true
      } else {
        this.updateCustomer(this.cardSource)
      }
    },
    selectCard(id) {
      this.cardSource = id
    },
    async updateCustomer(sourceId) {
      try {
        const customer = await this.$apollo.mutate({
          mutation: require('@/graphql/License/update-customer.gql'),
          variables: {
            email: this.email,
            name: this.username,
            source: sourceId
          },
          errorPolicy: 'all'
        })

        console.log(customer)
      } catch (e) {
        console.log(e)
      }
    },
    afterEnter(element) {
      element.style.height = 'auto'
    },
    beforeLeave(element) {
      this.previousHeight = getComputedStyle(element).height
    },
    enter(element) {
      const { height } = getComputedStyle(element)
      element.style.height = this.previousHeight

      setTimeout(() => {
        element.style.height = height
      })
    }
  }
}
</script>

<template>
  <div
    class="form-container text-center blue-grey--text text--darken-2 white rounded elevation-8 pa-8"
  >
    <div class="text-h4 font-weight-light">
      Confirm your payment details
    </div>

    <div class="card-container" key="card-form-container">
      <transition
        name="fade"
        mode="out-in"
        @beforeLeave="beforeLeave"
        @enter="enter"
        @afterEnter="afterEnter"
      >
        <div v-if="showCardForm" key="card-form">
          <div
            v-if="showCardForm"
            class="d-inline-block text-subtitle-1 font-weight-light mx-auto cursor-pointer mt-4 h-auto"
            @click="showCardForm = false"
          >
            <v-icon color="blue-grey">chevron_left</v-icon>
            Choose an existing card instead
          </div>

          <CardDetails @confirm="handleConfirm" />
        </div>

        <div
          v-else
          class="card-selection d-flex align-center justify-center flex-column"
          key="card-selection"
        >
          <div
            class="card-display mt-auto"
            :class="{ active: cardSource == 'new' }"
            @click.stop="selectCard('new')"
          >
            <div class="text-h6 font-weight-light">
              Enter new card
            </div>
          </div>

          <div v-if="cards && cards.length" class="card-or text-center my-8">
            <div class="d-inline-block position-relative white py-2 px-8">
              OR
            </div>
          </div>

          <div
            v-for="card in cards"
            :key="card.id"
            class="card-display mb-auto d-flex align-center justify--start"
            :class="{ active: cardSource == card.source }"
            @click="selectCard(card.source)"
          >
            <div>
              <div v-if="card.owner.name" class="text-h5 font-weight-light">
                {{ card.owner.name }}
              </div>
              <div class="mt-1">
                <div class="text-subtitle-1">{{ card.card.brand }}</div>

                <div class="mt-n2">
                  <span class="text-h6 font-weight-regular">
                    •••• •••• •••• {{ card.card.last4 }}
                  </span>
                  <span class="ml-1 text-subtitle-1 font-weight-light">
                    {{ card.card.exp_month }}/{{ card.card.exp_year }}
                  </span>
                </div>
              </div>
            </div>

            <div class="ml-auto">
              <v-icon large>
                fab fa-cc-{{ card.card.brand.toLowerCase() }}
              </v-icon>
            </div>
          </div>

          <v-btn
            v-if="!showCardForm"
            color="prefect"
            class="mt-auto white--text"
            :disabled="loading || !cardSource"
            :loading="loading"
            style="width: 100%;"
            data-cy="save-payment"
            @click="handleNext"
          >
            Next
          </v-btn>
        </div>
      </transition>
    </div>
  </div>
  <!-- <v-card :loading="loading">
    <v-card-title class="grey--text text--darken-2">
      Change to the
      <span class="primary--text px-1"> Prefect {{ planName }}</span> Plan
    </v-card-title>
    <v-card-text>
      <v-alert
        v-if="!isTenantAdmin & !loading"
        class="mx-auto mb-12"
        border="left"
        colored-border
        elevation="2"
        type="warning"
        tile
        icon="lock"
        max-width="540"
        >Only your team's administrators can modify these settings.
      </v-alert>
      <v-alert
        v-else-if="!isSelfServe & !loading"
        class="mx-auto mb-12"
        border="left"
        colored-border
        elevation="2"
        type="info"
        tile
        icon="lock"
        max-width="540"
      >
        To change your license terms, please
        <a href="https://www.prefect.io/get-prefect#contact" target="_blank"
          >contact our sales team</a
        >
      </v-alert>
      <div v-else-if="existingCard && planCost">
        <i class="fas fa-credit-card" />
        Your card ending in
        <span class="font-weight-bold"> {{ existingCard.last4 }}</span>

        will be charged
        <span class="font-weight-bold ">${{ planCost }} </span> on a monthly
        basis.
      </div>
      <div v-else-if="planCost && !existingCard"> <Billing page="plan"/></div>
      <div v-if="!planCost && isSelfServe">
        This plan is free. If you want to run more than {{ limit }} task
        runs/month you will need to add a credit card in the Team Account page.
      </div>
    </v-card-text>
    <v-card-actions class="py-4">
      <v-spacer />
      <v-btn
        v-if="isSelfServe && isTenantAdmin"
        text
        @click="changePlanDialog = false"
      >
        Cancel
      </v-btn>
      <v-btn
        v-if="isSelfServe && isTenantAdmin"
        :loading="loading"
        color="primary"
        @click="changePlan"
      >
        Confirm
      </v-btn>
    </v-card-actions>
  </v-card> -->
</template>

<style lang="scss" scoped>
.form-container {
  height: min-content;
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
    min-height: 710px;
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

.h-100 {
  height: 100%;
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
</style>
