<script>
import { mapGetters } from 'vuex'
import { PLANS_2021 } from '@/utils/plans'
import ChartCard from '@/components/ChartCard/ChartCard'
import { formatTime } from '@/mixins/formatTimeMixin'

export default {
  components: {
    ChartCard
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
    ...mapGetters('license', ['license', 'tempLicenseType']),
    ...mapGetters('user', ['timezone']),
    plan() {
      const type = this.tempLicenseType || this.license?.terms?.plan
      const name = type === 'STARTER_2021' ? 'FREE_2021' : type
      const plan = this.plans.filter(planType => planType.value === name)
      return plan[0]
    },
    smallScreen() {
      return this.$vuetify.breakpoint.xs ? '' : 'pt-12'
    },
    usedTaskRuns() {
      return 20000
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
      return this.chargeableRuns * this.plan.additionalCost
    },
    noExtra() {
      return (
        this.usedTaskRuns < this.planTaskRuns && this.plan.value === 'FREE_2021'
      )
    },
    taskRunsPerDay() {
      return Math.round(this.usedTaskRuns / this.daysFromInvoice())
    }
  },
  watch: {},
  methods: {
    daysUntilInvoice() {
      const today = new Date()
      return this.dateDiff(today, this.subscriptionPeriodEnd) - 1
    },
    daysFromInvoice() {
      const today = new Date()
      return this.dateDiff(today, this.subscriptionPeriodBegun) + 1
    }
  }
}
</script>

<template>
  <v-card tile max-width="720" class="mx-auto my-4">
    <v-card-title> Usage</v-card-title>
    <v-card-subtitle> Check your task run usage.</v-card-subtitle>
    <v-card-text>
      <v-row v-if="noExtra">
        <v-col v-if="!$vuetify.breakpoint.xs" cols="0" sm="7">
          <ChartCard
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
        </v-col>
        <v-col cols="12" sm="5"
          ><ul>
            <li :class="smallScreen"
              >You are on the Prefect {{ plan.name }} Plan. </li
            ><li> You have used {{ usedTaskRuns }} task runs!</li>
            <li>
              You have {{ taskRunsLeft }} task runs left until
              {{ subscriptionPeriodEnd }}
            </li>
          </ul>
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col v-if="!$vuetify.breakpoint.xs" cols="0" sm="7">
          <ChartCard
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
        /></v-col>
        <v-col cols="12" sm="5"
          ><ul
            ><li :class="smallScreen"
              >You are on the Prefect {{ plan.name }} Plan. </li
            ><li
              >Your billing period started on {{ subscriptionPeriodBegun }} and
              will end on {{ subscriptionPeriodEnd }}.
            </li>
            <li v-if="planTaskRuns">
              You have {{ planTaskRuns }} in your plan and have used
              {{ chargeableRuns }} extra runs at ${{
                plan.additionalCost
              }}/run.</li
            >
            <li v-else>
              You have used {{ chargeableRuns }} task runs at ${{
                plan.additionalCost
              }}/run.</li
            >
            <li> Your total so far is ${{ costSoFar }}.</li>
            <!-- <li>We predict your final monthly cost will be.... </li> -->
          </ul>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
