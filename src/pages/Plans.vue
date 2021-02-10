<script>
// import MenuTooltip from '@/components/MenuTooltip'
import PlanCard from '@/components/PlanCard'
import ChangePlanDialog from '@/components/License/ChangePlanDialog'
import {
  PLANS_2021,
  basicFeatures,
  infrastructureFeatures,
  observabilityFeatures,
  orchestrationFeatures,
  authorizationFeatures
} from '@/utils/plans'
import { mapGetters } from 'vuex'

PlanCard
ChangePlanDialog

export default {
  components: {
    // MenuTooltip
    // ManagementLayout,
    // PlanCard,
    // ChangePlanDialog
  },
  data() {
    return {
      categories: [
        { title: 'Basic', icon: 'fad fa-atom-alt', features: basicFeatures },
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
        },
        {
          title: 'Auth',
          icon: 'fad fa-user-shield',
          features: authorizationFeatures
        }
      ],
      plans: PLANS_2021
      // selected: 0
    }
  },
  computed: {
    ...mapGetters('license', ['license', 'tempLicenseType']),
    ...mapGetters('tenant', ['tenant'])
    // planType() {
    //   return this.plans[this.selected]
    // }
  },
  created() {
    //creates a non-reactive property that isn't tracked by Vue - so that selected doesn't reset
    // const name =
    //   this.license?.terms.plan === 'STARTER_2021'
    //     ? 'FREE_2021'
    //     : this.license?.terms?.plan
    // const plan = this.plans.findIndex(planType => planType.value === name)
    // this.selected = plan > 0 ? plan : 0
  },
  methods: {
    excluded(feature) {
      if (
        this.planType?.title === 'good' &&
        (feature.plan === 'better' || feature.plan === 'best')
      ) {
        return true
      } else if (this.planType?.title === 'better' && feature.plan === 'best') {
        return true
      } else {
        return false
      }
    },
    updatePlan(type) {
      const index = this.plans.findIndex(planType => planType.value === type)
      this.selected = index
    }
  }
}
</script>

<template>
  <v-container fluid class="pa-0">
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
          <div class="text-h3 font-weight-light text-center">
            <div class="blue-grey--text text--darken-4">
              Pay for what you use.
            </div>
            <div class="mt-4 white--text">
              Eliminate negative engineering.
            </div>
          </div>

          <div class="mt-8 mt-md-16 d-flex justify-space-around">
            <div
              class="plan-card blue-grey darken-2 white--text mr-0 ml-auto mt-8 rounded elevation-4"
            >
              <div class="font-weight-regular text-center py-8 plan-title">
                Starter
              </div>
              <v-divider class="divider-light" />
              <div
                class="text-h6 font-weight-regular text-center grey--text text--lighten-3"
              >
                <div class="mt-8">
                  Cloud-native workflow orchestration
                </div>
                <div
                  class="mt-4 text-h2 font-weight-regular white--text plan-task-run-price d-flex align-center justify-center"
                >
                  <span class="mr-2 font-weight-light d-inline-block plan-cent">
                    $ </span
                  >0.0025

                  <!-- Hiding this for now until we can link to the success-based pricing page; that page will have a much more helpful breakdown as well as calculators that take automatic volume discounts into account! -->
                  <!-- <MenuTooltip
                  offset-y
                  hide-close
                  icon-color="white"
                  icon-class="align-self-start ml-1"
                >
                  On this plan you get
                  <span class="font-weight-bold"
                    >10,000 successful task runs</span
                  >
                  for free each month; after that, task runs are billed at a
                  quarter of a cent per successful run (<em
                    >you never pay for failure!</em
                  >). That means the next 10,000 would cost just
                  <span class="font-weight-medium primary--text">$25</span>!
                </MenuTooltip> -->
                </div>
                <div class="mt-2 text-h6 font-weight-light">
                  per successful task run
                </div>

                <div
                  class="mt-16 text-left plan-body d-flex align-start justify-center flex-column"
                >
                  <div class="d-flex align-center justify-center">
                    <span
                      class="rounded-circle plans-feature-icon plans-feature-icon-light"
                    >
                      <v-icon small>
                        fad fa-tasks
                      </v-icon>
                    </span>
                    <span class="ml-2">10,000 free task runs per month</span>
                  </div>

                  <div class="mt-3 d-flex align-center justify-center">
                    <span
                      class="rounded-circle plans-feature-icon plans-feature-icon-light"
                    >
                      <v-icon small>
                        fad fa-clouds
                      </v-icon>
                    </span>
                    <span class="ml-2">You build, we orchestrate</span>
                  </div>
                </div>

                <div class="plan-cta plan-cta-dark py-7 mt-16">
                  Get started now
                </div>
              </div>
            </div>

            <div class="plan-card white rounded elevation-7">
              <div class="font-weight-regular text-center py-8 plan-title">
                Standard
                <div class="text-body-1 prefect--text text-none">
                  Recommended
                </div>
              </div>
              <v-divider class="divider-dark" />
              <div class="text-h6 font-weight-regular text-center">
                <div class="mt-8 blue-grey--text text--darken-2">
                  A complete workflow automation platform
                </div>
                <div
                  class="mt-4 text-h2 font-weight-regular blue-grey--text text--darken-3 plan-task-run-price d-flex align-center justify-center"
                >
                  <span class="mr-2 font-weight-light d-inline-block plan-cent">
                    $ </span
                  >0.0050

                  <!-- Hiding this for now until we can link to the success-based pricing page; that page will have a much more helpful breakdown as well as calculators that take automatic volume discounts into account! -->
                  <!-- <MenuTooltip
                  offset-y
                  hide-close
                  icon-class="align-self-start ml-1"
                >
                  On this plan, task runs are billed at a half a cent per
                  succesful run (<em>you never pay for failure!</em>). That
                  means you'd pay
                  <span class="font-weight-bold primary--text">$50</span> for
                  <span class="font-weight-bold"
                    >10,000 successful task runs</span
                  >.
                </MenuTooltip> -->
                </div>
                <div class="mt-2 text-h6 font-weight-light">
                  per successful task run
                </div>

                <div
                  class="mt-16 text-left plan-body d-flex align-start justify-center flex-column"
                >
                  <div class="d-flex align-center justify-center">
                    <span class="rounded-circle plans-feature-icon">
                      <v-icon small>
                        fad fa-toolbox
                      </v-icon>
                    </span>
                    <span class="ml-2">
                      Seamlessly integrate your existing tools
                    </span>
                  </div>

                  <div class="mt-3 d-flex align-center justify-center">
                    <span class="rounded-circle plans-feature-icon">
                      <v-icon small>
                        fad fa-user-shield
                      </v-icon>
                    </span>
                    <span class="ml-2">Basic role-based permissioning</span>
                  </div>

                  <div class="mt-3 d-flex align-center justify-center">
                    <span class="rounded-circle plans-feature-icon">
                      <v-icon small>
                        fad fa-siren-on
                      </v-icon>
                    </span>
                    <span class="ml-2">Workflow and infrastructure SLAs</span>
                  </div>

                  <div class="mt-3 d-flex align-center justify-center">
                    <span class="rounded-circle plans-feature-icon">
                      <v-icon small>
                        fad fa-random
                      </v-icon>
                    </span>
                    <span class="ml-2">Customizable stateful actions</span>
                  </div>

                  <div class="mt-3 d-flex align-center justify-center">
                    <span class="rounded-circle plans-feature-icon">
                      <v-icon small>
                        fad fa-shield
                      </v-icon>
                    </span>
                    <span class="ml-2">Best-in-class automatic security</span>
                  </div>
                </div>

                <div class="plan-cta py-7 mt-16">
                  Get started now
                </div>
              </div>
            </div>

            <div
              class="plan-card blue-grey darken-3 white--text ml-0 mr-auto mt-16 rounded-sm elevation-3"
            >
              <div class="font-weight-regular text-center py-8 plan-title">
                Enterprise
              </div>

              <v-divider class="divider-light" />
              <div class="text-h6 font-weight-regular text-center">
                <div class="mt-8">
                  Built for your business

                  <div class="mt-2 font-weight-light">
                    Get in touch to build your Prefect Cloud
                  </div>
                </div>

                <div
                  class="mt-16 d-flex align-center justify-center flex-column"
                >
                  <div class="plan-table">
                    <div class="py-2 px-8">Unlimited users</div>
                    <div class="py-2 px-8">Custom RBAC / SSO</div>
                    <div class="py-2 px-8">Volume discounts</div>
                    <div class="py-2 px-8">Audit trail</div>
                  </div>
                </div>

                <div class="plan-cta plan-cta-dark py-7 mt-16">
                  Contact sales <v-icon color="grey">arrow_right</v-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="features-container blue-grey--text text--darken-3">
      <div class="text-center text-h3 font-weight-light">Features</div>

      <div class="features-body">
        <v-row no-gutters>
          <v-col
            v-for="category in categories"
            :key="category.title"
            cols="12"
            sm="6"
            md="4"
            class="d-flex align-start justify-center text-left my-8"
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
                class="text-h6 font-weight-light"
              >
                {{ feature.name }}
              </div>
            </div>
          </v-col>
        </v-row>
      </div>
    </div>

    <!-- <ManagementLayout> -->

    <!-- <div
      style="display: flex;
            flex-direction: row;
            justify-content: center;"
      class="py-8"
    >
      <v-item-group v-model="selected" mandatory>
        <v-row>
          <v-col
            v-for="(plan, i) in plans"
            :key="i"
            cols="12"
            md="4"
            class="pa-0"
          >
            <v-item v-slot="{ active, toggle }">
              <div @click="toggle">
                <PlanCard
                  :plan="plan.title"
                  :selected="active"
                  :class="
                    Math.abs(selected - i) > 1
                      ? 'away elevation-0'
                      : Math.abs(selected - i) === 1
                      ? 'adjacent elevation-2'
                      : 'active elevation-4'
                  "
                />
              </div>
            </v-item>
          </v-col>
        </v-row>
      </v-item-group>
    </div>
    <div class="text-center pb-8">
      <v-btn
        v-if="selected === 2"
        color="primary"
        href="https://www.prefect.io/get-prefect#contact"
        target="_blank"
      >
        Contact Sales
      </v-btn>
      <ChangePlanDialog v-else :plan="planType" @update="updatePlan" />
    </div>

    <v-card class="pa-6 mb-8">
      <h3 class="py-2">All plans come with:</h3>
      <ul
        style="column-count: 2;
    column-gap: 40px;
    list-style-type: none;"
      >
        <li
          v-for="(feature, i) in basicFeatures"
          :key="i"
          style="flex-direction: column;"
        >
          <p class="feature-title">{{ feature.name }}</p>
          <p class="subtitle">{{ feature.description }}</p>
        </li>
      </ul>
    </v-card>

    <h2 class="pt-4">Additionally, this plan includes:</h2>

    <div
      class="pt-4 pb-8"
      style="display: flex;
    flex-direction: row;"
      :style="
        $vuetify.breakpoint.lgAndDown
          ? { width: 'auto', flexWrap: 'wrap' }
          : { width: '100%' }
      "
    >
      <v-card
        :style="
          $vuetify.breakpoint.lgAndDown
            ? { flexBasis: '50%' }
            : { flexBasis: '25%' }
        "
        class="pa-4 mb-8"
      >
        <h3 class="py-2">Infrastructure</h3>
        <ul style="list-style-type: none;">
          <li v-for="(feature, i) in infrastructureFeatures" :key="i">
            <p
              class="feature-title"
              :class="{ 'text--disabled': excluded(feature) }"
              >{{ feature.name }}</p
            >
            <p
              class="subtitle"
              :class="{ 'text--disabled': excluded(feature) }"
              >{{ feature.description }}</p
            >
          </li>
        </ul>
      </v-card>
      <v-card
        :style="
          $vuetify.breakpoint.lgAndDown
            ? { flexBasis: '50%' }
            : { flexBasis: '25%' }
        "
        class="pa-4 mb-8"
      >
        <h3 class="py-2">Observability</h3>
        <ul style="list-style-type: none;">
          <li v-for="(feature, i) in observabilityFeatures" :key="i">
            <p
              class="feature-title"
              :class="{ 'text--disabled': excluded(feature) }"
              >{{ feature.name }}</p
            >
            <p
              class="subtitle"
              :class="{ 'text--disabled': excluded(feature) }"
              >{{ feature.description }}</p
            >
          </li>
        </ul>
      </v-card>
      <v-card
        :style="
          $vuetify.breakpoint.lgAndDown
            ? { flexBasis: '50%' }
            : { flexBasis: '25%' }
        "
        class="pa-4 mb-8"
      >
        <h3 class="py-2">Orchestration</h3>
        <ul style="list-style-type: none;">
          <li v-for="(feature, i) in orchestrationFeatures" :key="i">
            <p
              class="feature-title"
              :class="{ 'text--disabled': excluded(feature) }"
              >{{ feature.name }}</p
            >
            <p
              class="subtitle"
              :class="{ 'text--disabled': excluded(feature) }"
              >{{ feature.description }}</p
            >
          </li>
        </ul>
      </v-card>
      <v-card
        :style="
          $vuetify.breakpoint.lgAndDown
            ? { flexBasis: '50%' }
            : { flexBasis: '25%' }
        "
        class="pa-4 mb-8"
      >
        <h3 class="py-2">Authorization</h3>
        <ul style="list-style-type: none;">
          <li v-for="(feature, i) in authorizationFeatures" :key="i">
            <p
              class="feature-title"
              :class="{ 'text--disabled': excluded(feature) }"
              >{{ feature.name }}</p
            >
            <p
              class="subtitle"
              :class="{ 'text--disabled': excluded(feature) }"
              >{{ feature.description }}</p
            >
          </li>
        </ul>
      </v-card>
    </div>
    <div class="text-center pb-4">
      <v-btn
        v-if="selected === 2"
        color="primary"
        href="https://www.prefect.io/get-prefect#contact"
        target="_blank"
      >
        Contact Sales
      </v-btn>
      <ChangePlanDialog v-else :plan="planType" />
    </div> -->
  </v-container>
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
  }
}

.header-container {
  padding-top: 124px;
  position: relative;
  z-index: 1;
}

.plan-card {
  height: min-content;
  overflow: hidden;
  width: 500px;

  .plan-title {
    font-size: 1.15rem;
    letter-spacing: 0.15rem;
    text-transform: uppercase;
  }

  .divider-dark {
    border-color: #eee;
  }

  .divider-light {
    border-color: #3f515a;
  }

  .plan-body {
    font-size: 1.2rem !important;
    font-weight: 400 !important;
    margin: auto;
    max-width: 350px;
    width: max-content;
  }

  .plan-feature-icon {
    align-items: center;
    display: inline-flex;
    height: 20px;
    justify-content: center;
    width: 20px;
  }

  .plan-cent {
    font-size: 3rem !important;
    vertical-align: middle;
  }

  .plan-table {
    column-gap: 2px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    row-gap: 2px;

    div {
      background-color: #455a64;
    }
  }

  .plan-cta {
    background-color: #f7fcfd;
    cursor: pointer;
    font-size: 1rem;
    letter-spacing: 0.15rem;
    text-transform: uppercase;
    transition: all 50ms;

    &.plan-cta-dark {
      background-color: #546e7a;

      &:focus,
      &:hover {
        background-color: #5a7581 !important;
        color: #fff;
      }
    }

    &:focus,
    &:hover {
      background-color: #e9f7fc !important;
      font-weight: 500 !important;
    }
  }
}

.features-container {
  margin-top: 150px;

  .features-body {
    margin-top: 100px;
  }

  .features-category {
    height: 100%;
    min-width: 300px;
  }
}

/* @keyframes adjacent {
  100% {
    filter: contrast(65%);
    transform: scale(0.9);
  }
}

@keyframes away {
  100% {
    filter: contrast(35%);
    transform: scale(0.8);
  }
}

@keyframes active {
  100% {
    filter: contrast(100%);
    transform: scale(1);
  }
} */

/* .active {
  animation: active 1s forwards;
}

.adjacent {
  animation: adjacent 1s forwards;
}

.away {
  animation: away 1s forwards;
} */

/* .feature-title {
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.5rem;
  margin-bottom: 4px;
  text-align: left;
}

.subtitle {
  color: #444;
  font-size: 0.875rem;
} */
</style>
