<script>
import { mapGetters } from 'vuex'
import { PLANS_2021 } from '@/utils/plans'
import ChartCard from '@/components/ChartCard/ChartCard'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    ChartCard
  },
  filters: {
    numFormat(value) {
      if (!value) return ''
      return new Intl.NumberFormat().format(value)
    }
  },
  mixins: [formatTime],
  data() {
    return {
      loading: false,
      plans: Object.values(PLANS_2021)
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('user', ['user']),
    ...mapGetters('license', ['license', 'tempLicenseType', 'planType']),
    ...mapGetters('user', ['timezone']),
    plan() {
      const type = this.tempLicenseType || this.license?.terms?.plan
      const name = type === 'STARTER_2021' ? 'FREE_2021' : type
      const plan = this.plans.filter(planType => planType.value === name)
      return plan[0]
    },
    smallScreen() {
      return this.$vuetify.breakpoint.xs ? '' : 'pt-16'
    },
    usedTaskRuns() {
      return 221000
    },
    subscriptionPeriodEnd() {
      const dtFormat = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium'
      })
      return dtFormat.format(
        new Date(this.license.stripe_subscription.current_period_end * 1e3)
      )
    },
    subscriptionPeriodBegun() {
      const dtFormat = new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium'
      })
      return dtFormat.format(
        new Date(this.license.stripe_subscription.current_period_start * 1e3)
      )
    },
    taskRunsLeft() {
      return this.planTaskRuns - this.usedTaskRuns
    },
    planTaskRuns() {
      return this.license?.terms?.task_runs_usage_limit || this.plan.taskRuns
    },
    chargeableRuns() {
      return this.usedTaskRuns - this.planTaskRuns
    },
    costSoFar() {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(this.chargeableRuns * this.plan.additionalCost)
    },
    noExtra() {
      return (
        this.usedTaskRuns < this.planTaskRuns && this.plan.value === 'FREE_2021'
      )
    },
    taskRunsPerDay() {
      return new Intl.NumberFormat().format(
        Math.round(this.usedTaskRuns / this.daysFromInvoice())
      )
    }
  },
  watch: {
    tenant(val) {
      this.loading = true
      if (val) {
        setTimeout(() => {
          this.loading = false
        }, 1000)
      }
    }
  },
  methods: {
    daysUntilInvoice() {
      const today = new Date()
      return this.dateDiff(today, this.subscriptionPeriodEnd) - 1
    },
    daysFromInvoice() {
      const today = new Date()
      return this.dateDiff(this.subscriptionPeriodBegun, today) + 1
    }
  }
}
</script>

<template>
  <v-card tile max-width="720" class="mx-auto my-4" :loading="loading">
    <v-card-title> Usage</v-card-title>
    <v-card-subtitle class="pb-0"> Check your task run usage.</v-card-subtitle>
    <v-card-text>
      <v-row>
        <v-col v-if="!$vuetify.breakpoint.xs" cols="0" sm="7">
          <ChartCard
            v-if="plan.value === 'FREE_2021'"
            :chart-data="[
              { label: 'used', value: usedTaskRuns, color: '#ff8cc6' },
              { name: 'Plan Runs', value: taskRunsLeft, color: '#de369d' }
            ]"
            :extra="false"
            chart-type="ring"
            :colors="['#27b1ff', '#f9f9f9']"
            accent-color="#fff"
            chart-overlay-center-type="text"
            :chart-overlay-center="`${usedTaskRuns}/${planTaskRuns}`"
            chart-overlay-center-two="Task Runs Used"
          />
          <ChartCard
            v-else
            :chart-data="[
              {
                label: 'daysPassed',
                value: daysFromInvoice(),
                color: '#ff8cc6'
              },
              { name: 'daysLeft', value: daysUntilInvoice(), color: '#de369d' }
            ]"
            :extra="false"
            chart-type="ring"
            :colors="['#27b1ff', '#f9f9f9']"
            accent-color="#fff"
            chart-overlay-center-type="text"
            :chart-overlay-center="`${taskRunsPerDay}`"
            chart-overlay-center-two="Task Runs/Day"
          />
        </v-col>
        <v-col v-if="noExtra" cols="12" sm="5"
          ><ul>
            <li :class="smallScreen"
              >You are on the Prefect {{ plan.name }} Plan. </li
            ><li> You have used {{ usedTaskRuns | numFormat }} task runs</li>
            <li>
              You have {{ taskRunsLeft | numFormat }} task runs left until
              {{ subscriptionPeriodEnd }}.
              <span v-if="planType('STARTER')">
                You will then be charged ${{ plan.additionalCost }}/task
                run.</span
              >
            </li>
          </ul>
        </v-col>
        <v-col v-else cols="12" sm="5"
          ><ul
            ><li :class="smallScreen"
              >You are on the Prefect {{ plan.name }} Plan. </li
            ><li
              >Your billing period started on {{ subscriptionPeriodBegun }} and
              will end on {{ subscriptionPeriodEnd }}.
            </li>
            <li v-if="planTaskRuns">
              You have {{ planTaskRuns | numFormat }} task runs in your plan and
              have used {{ chargeableRuns | numFormat }} extra runs at ${{
                plan.additionalCost
              }}/run.</li
            >
            <li v-else>
              You have used {{ chargeableRuns | numFormat }} task runs at ${{
                plan.additionalCost
              }}/run.</li
            >
            <li> Your total so far is {{ costSoFar }}.</li>
            <!-- <li>We predict your final monthly cost will be.... </li> -->
          </ul>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
