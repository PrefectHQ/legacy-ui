<script>
import EnterprisePlan from '@/components/Plans/Enterprise'
import PlanSelectionForm from '@/components/Plans/PlanSelectionForm'
import MenuTooltip from '@/components/MenuTooltip'
import StarterPlan from '@/components/Plans/Starter'
import StandardPlan from '@/components/Plans/Standard'

import {
  PLANS_2021,
  basicFeatures,
  infrastructureFeatures,
  observabilityFeatures,
  orchestrationFeatures,
  authorizationFeatures
} from '@/utils/plans'

import { mapGetters } from 'vuex'

export default {
  components: {
    // ChangePlanDialog,
    EnterprisePlan,
    MenuTooltip,
    PlanSelectionForm,
    StandardPlan,
    StarterPlan
  },
  data() {
    return {
      categories: [
        { title: 'Basic', icon: 'fad fa-atom-alt', features: basicFeatures },
        {
          title: 'Auth',
          icon: 'fad fa-user-shield',
          features: authorizationFeatures
        },
        {
          title: 'Infrastructure',
          icon: 'fad fa-network-wired',
          features: infrastructureFeatures
        },
        {
          title: 'Observability',
          icon: 'fad fa-chart-scatter',
          features: observabilityFeatures
        },
        {
          title: 'Orchestration',
          icon: 'fad fa-chart-network',
          features: orchestrationFeatures
        }
      ],
      complete: false,
      plans: PLANS_2021,
      plan: null,
      planValue: 2
    }
  },
  computed: {
    ...mapGetters('license', ['license', 'tempLicenseType', 'hasPermission']),
    planClass() {
      return {
        'scale-100': this.$vuetify.breakpoint.lgAndUp,
        'scale-85': this.$vuetify.breakpoint.mdOnly,
        'scale-75': this.$vuetify.breakpoint.smOnly
      }
    },
    plansContainerClass() {
      return {
        'd-flex': true,
        'justify-center': true,
        'align-center': true,
        'flex-column': this.$vuetify.breakpoint.smAndDown
      }
    },
    permissionsCheck() {
      return this.hasPermission('create', 'license')
    }
  },
  methods: {
    goBack() {
      this.$router.back()
    },
    handlePlanSelection(type) {
      this.plan = type
      this.planValue = type == 'starter' ? 1 : 2
    },
    handlePlanDeselection() {
      this.plan = null
    }
  }
}
</script>

<template>
  <div>
    <div class="position-relative">
      <div class="position-relative my-0">
        <div class="slash-container">
          <div class="slash slash-0"></div>
          <div class="slash slash-1"></div>
          <div class="slash slash-2"></div>
          <div class="slash slash-3"></div>
          <div class="slash slash-4"></div>
        </div>

        <div class="header-container">
          <div
            class="back-button d-inline-block text-h6 font-weight-light mx-auto cursor-pointer white--text"
            @click="goBack"
          >
            <v-icon color="blue-grey lighten-3">chevron_left</v-icon>
            Back
          </div>

          <div class="text-h3 font-weight-light text-center">
            <div class="blue-grey--text text--darken-4">
              Simple,
              <span>success-based pricing</span>.
            </div>
            <div class="mt-4 white--text">
              Eliminate negative engineering.
            </div>
          </div>

          <transition-group
            name="flex"
            mode="out-in"
            class="plans-container mt-8 mx-8"
            :class="plansContainerClass"
          >
            <StarterPlan
              v-if="(!plan || plan == 'starter') && !complete"
              key="starter"
              :hide-details="!!plan"
              :disabled="!permissionsCheck"
              @click="handlePlanSelection('starter')"
            />

            <StandardPlan
              v-if="(!plan || plan == 'standard') && !complete"
              key="standard"
              :hide-details="!!plan"
              :disabled="!permissionsCheck"
              @click="handlePlanSelection('standard')"
            />

            <EnterprisePlan
              v-if="!plan && !complete"
              key="enterprise"
              class="mt-md-16 mt-0"
              :hide-details="!!plan"
            />

            <div
              v-if="plan"
              key="payment-form"
              class="plan-container mt-n4 px-12 px-md-0"
            >
              <PlanSelectionForm
                :plan-reference="plan"
                @complete="complete = true"
              />
            </div>
          </transition-group>

          <div v-if="plan && !complete" class="text-center mt-8">
            <div
              class="d-inline-block text-h6 font-weight-light mx-auto cursor-pointer"
              @click="handlePlanDeselection"
            >
              <v-icon color="blue-grey">chevron_left</v-icon>
              Choose a different plan
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition name="quick-fade">
      <div v-if="!complete" class="features-container utilGrayDark--text">
        <div class="text-center text-h3 font-weight-light">Features</div>

        <div class="text-center mt-8">
          <fieldset class="multiswitch">
            <legend class="text-h5 font-weight-light">
              Select a plan to view features
            </legend>

            <div class="slide-container text-h6 font-weight-light">
              <input
                id="starter"
                v-model="planValue"
                type="radio"
                name="plan"
                :value="1"
              />
              <label for="starter">Starter</label>
              <input
                id="standard"
                v-model="planValue"
                type="radio"
                name="plan"
                :value="2"
                checked
                required
              />
              <label for="standard">Standard</label>
              <input
                id="enterprise"
                v-model="planValue"
                type="radio"
                name="plan"
                :value="3"
              />
              <label for="enterprise">Enterprise</label>

              <a class="slide" aria-hidden="true"></a>
            </div>
          </fieldset>
        </div>

        <div class="features-body">
          <v-row no-gutters>
            <v-col
              v-for="category in categories"
              :key="category.title"
              cols="12"
              sm="6"
              md="4"
              class="d-flex align-start justify-center my-8"
            >
              <div class="features-category">
                <div class="feature-category-icon">
                  <v-icon large>
                    {{ category.icon }}
                  </v-icon>
                </div>

                <div class="text-h4 font-weight-light my-4">
                  {{ category.title }}
                </div>
                <div
                  v-for="feature in category.features"
                  :key="feature.name"
                  class="text-h6 font-weight-regular my-2"
                >
                  <MenuTooltip
                    hide-close
                    offset-y
                    top
                    nudge-top="12px"
                    transition="slide-y-reverse-transition"
                  >
                    <template #activator>
                      <div
                        class="d-flex justify-start align-center utilGrayDark--text flex-grow-1 feature-list-title"
                        :class="{
                          'o-50': feature.value && planValue < feature.value
                        }"
                        style="transition: all 150ms ease-in-out;"
                      >
                        <span
                          class="flex-grow-0 flex-shrink-0 feature-list-icon"
                          :class="{
                            'empty-circle': feature.plan == 'starter',
                            'feature-list-icon-disabled':
                              feature.value && planValue < feature.value
                          }"
                        >
                          <v-icon v-if="feature.plan == 'enterprise'" x-small>
                            fas fa-circle fa-fw
                          </v-icon>
                          <v-icon
                            v-else-if="feature.plan == 'standard'"
                            x-small
                          >
                            fad fa-dot-circle fa-fw
                          </v-icon>
                          <v-icon v-else-if="feature.plan == 'starter'" x-small>
                            fad fa-dot-circle fa-fw
                          </v-icon>
                          <v-icon v-else x-small>fas fa-check fa-fw</v-icon>
                        </span>
                        <div class="flex-shrink-0 flex-grow-1 ml-2">
                          {{ feature.name }}
                        </div>
                      </div>
                    </template>

                    <div
                      class="utilGrayDark--text text--darken-1 text-subtitle-1"
                    >
                      {{ feature.description }}
                      <div
                        v-if="feature.plan == 'enterprise'"
                        class="text--disabled font-weight-light mt-4"
                      >
                        Available only on
                        <span class="text-overline primary--text"
                          >enterprise</span
                        >
                        plans
                      </div>
                      <div
                        v-else-if="feature.plan == 'standard'"
                        class="text--disabled font-weight-light mt-4"
                      >
                        Available on
                        <span class="text-overline primary--text"
                          >standard</span
                        >
                        plans and above
                      </div>
                      <div
                        v-else-if="feature.plan == 'starter'"
                        class="text--disabled font-weight-light mt-4"
                      >
                        Available on
                        <span class="text-overline primary--text">starter</span>
                        plans and above
                      </div>
                      <div v-else class="text--disabled font-weight-light mt-4">
                        Available on all plans
                      </div>
                    </div>
                  </MenuTooltip>
                </div>
              </div>
            </v-col>
          </v-row>
        </div>
      </div>
    </transition>
    <transition name="quick-fade">
      <div v-if="!complete" class="support-container">
        <div class="slash-container">
          <div class="slash slash-5"></div>
          <div class="slash slash-6"></div>
        </div>

        <v-card
          class="pa-8 margin-auto support-card elevation-4 rounded d-flex align-start justify-start"
          tile
        >
          <div class="d-inline-block support-icon">
            <v-icon large>fad fa-concierge-bell</v-icon>
          </div>

          <v-row class="ml-4" no-gutters>
            <v-col cols="12" sm="8">
              <div class="utilGrayDark--text text-h4 font-weight-light pa-0">
                <span>Premium Support</span>
              </div>
              <div
                class="mt-2 text-h6 font-weight-light utilGrayDark--text pa-0"
              >
                A support plan built to help you quickly grow your workflows.

                <div class="mt-2 support-table text-h6 font-weight-light">
                  <div class="my-2 mr-6">
                    <span class="support-icon mr-2">
                      <v-icon>fad fa-badge-check</v-icon>
                    </span>
                    Faster, prioritized support responses
                  </div>
                  <div class="my-2 mr-6">
                    <span class="support-icon mr-2">
                      <v-icon>fad fa-badge-check</v-icon>
                    </span>
                    Dedicated support manager
                  </div>
                  <div class="my-2 mr-6">
                    <span class="support-icon mr-2">
                      <v-icon>fad fa-badge-check</v-icon>
                    </span>
                    Emergency support for critical issues
                  </div>
                </div>
              </div>
            </v-col>
            <v-col cols="12" sm="4" class="d-flex align-center justify-start">
              <v-divider class="d-inline-block" vertical />
              <div class="ml-8">
                <div class="text-h4 accentGreen--text">
                  Support built for you
                </div>
                <a
                  class="utilGrayDark--text support-link text-h6 font-weight-regular mt-4"
                  href="https://www.prefect.io/pricing#contact"
                  target="_blank"
                  >Contact us
                  <v-icon class="mb-1" color="grey">arrow_right</v-icon>
                </a>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </div>
    </transition>
  </div>
</template>

<style lang="scss" scoped>
.slash-container {
  bottom: 100px;
  left: 0;
  position: absolute;
  right: 0;
  top: calc(50% + 75px);
  transform: skewY(-12deg);

  .slash {
    left: 0;
    position: absolute;
    right: 0;
    top: auto;
    width: 100%;

    &.slash-0 {
      background-image: linear-gradient(105deg, #0e50f5, #2edaff) !important;
      bottom: 10px;
      height: 5000px;
    }

    &.slash-1 {
      background: #27b1ff !important;
      bottom: 160px;
      height: 150px;
      width: 500px;
    }

    &.slash-2 {
      background: #3b8dff !important;
      bottom: 660px;
      height: 150px;
      left: auto;
      right: 0;
      width: 500px;
    }

    &.slash-3 {
      background: #2580ff !important;
      bottom: 10px;
      height: 150px;
      left: 100px;
      width: 500px;
    }

    &.slash-4 {
      background: #27b1ff !important;
      bottom: 310px;
      height: 150px;
      left: 1200px;
      width: 800px;
    }

    &.slash-5 {
      background: #27b1ff !important;
      bottom: 160px;
      height: 75px;
      left: 0;
      width: 500px;
    }

    &.slash-6 {
      background: #2edaff !important;
      bottom: -75px;
      height: 75px;
      left: auto;
      right: 0;
      width: 500px;
    }
  }
}

.header-container {
  min-height: 1072px;
  padding-top: 48px;
  position: relative;
  z-index: 1;
}

.back-button {
  left: 24px;
  position: absolute;
  top: 24px;
}

.plan-container {
  transition: all 250ms;
}

.features-container {
  margin-top: 175px;
  position: relative;

  .features-body {
    margin: auto;
    margin-top: 48px;
    max-width: 1200px;
  }

  .features-category {
    height: 100%;
    max-width: 400px;
    min-width: 300px;
    padding: 0 50px;
    width: 100%;
  }

  .feature-list-title {
    cursor: pointer;

    &:hover,
    &:focus {
      color: var(--v-primary-base) !important;
    }
  }

  .plan-title {
    letter-spacing: 0.15rem;
    text-transform: uppercase;
  }
}

.multiswitch {
  $steps: 6, 8, 10, 12;
  $third: calc(100% / 3);

  border: 0;
  margin: auto;
  width: 450px;

  a {
    background: var(--v-primary-base);
    border-radius: 4px;
    height: 100%;
    position: absolute;
    top: 50%;
    transform: translate(0, -50%);
    transition: all 0.15s ease-in-out;
    width: #{$third};
    z-index: 1;
  }

  input {
    left: -200vw;
    position: absolute;
  }

  label {
    cursor: pointer;
    text-align: center;
    transition: all 0.15s ease-in-out;
    width: #{$third};
    z-index: 2;
  }

  input:checked {
    ~ a {
      left: 0;
    }

    + label {
      color: #fff;
      font-weight: 400;
    }
  }

  @for $i from 1 through 3 {
    input:nth-of-type(#{$i}):checked ~ a {
      left: calc(#{$third} * (#{$i} - 1));
    }
  }

  .slide-container {
    background-color: #eee;
    border-radius: 4px;
    box-sizing: content-box;
    color: var(--v-secondaryGrayDark-base);
    display: flex;
    margin-top: 8px;
    overflow: hidden;
    padding: 6px 0;
    position: relative;
    user-select: none;
  }
}

.support-container {
  margin-bottom: 264px;
  margin-top: 64px;
  position: relative;

  .support-card {
    margin: auto;
    max-width: 1200px;

    .support-table {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .support-link {
      color: inherit !important;
      cursor: pointer;
      display: block;
      text-decoration: none;
    }
  }
}
</style>

<style lang="scss">
.flex-enter-active {
  animation: flex-enter 750ms ease;
}

.flex-leave-active {
  animation: flex-leave 500ms ease;
  position: absolute;
  z-index: -1;
}

@keyframes flex-enter {
  0% {
    opacity: 0;
    transform: translate(0) scale(0);
  }

  50% {
    opacity: 0;
    transform: translate(0) scale(0.4);
  }

  100% {
    opacity: 1;
    transform: translate(0) scale(1);
  }
}

@keyframes flex-leave {
  0% {
    opacity: 1;
    transform: translate(0) scale(1);
  }

  50% {
    opacity: 0.1;
    transform: translate(0) scale(0.4);
  }

  100% {
    opacity: 0;
    transform: translate(100px) scale(0);
  }
}
</style>
