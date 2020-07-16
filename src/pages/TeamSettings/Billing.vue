<script>
import { mapGetters, mapActions } from 'vuex'

import IconicCard from '@/components/IconicCard'
import ChartCard from '@/components/ChartCard/ChartCard'
import ManagementLayout from '@/layouts/ManagementLayout'
// import ClearDataDialog from '@/pages/TeamSettings/ClearDataDialog'

export default {
  components: {
    IconicCard,
    ChartCard,
    ManagementLayout
    // ClearDataDialog
  },
  data() {
    return {
      // Clear data
      // clearDataDialog: false,
      //Billing
      firstLoad: true,
      usedFlows: 0,
      activeUserNumber: 0,
      pendingUserNumber: 0
    }
  },
  computed: {
    ...mapGetters('auth0', ['authorizationToken']),
    ...mapGetters('tenant', ['tenant', 'role']),
    ...mapGetters('license', ['activePlan']),
    billingInfo() {
      if (
        this.activePlan?.terms?.users &&
        this.activePlan?.terms?.flows &&
        this.activePlan?.terms?.history_retention_days
      ) {
        return this.activePlan
      }

      return null
    },
    licenseIsActive() {
      if (this.activePlan) return !!this.activePlan.id
      return false
    },
    plan() {
      if (this.activePlan) return this.activePlan.name
      return ''
    },
    flowRingSegments() {
      return [
        { label: 'Flows', value: this.usedFlows },
        { label: 'Available Flows', value: this.flowNumber - this.usedFlows }
      ]
    },
    userRingSegments() {
      return [
        { label: 'Users', value: this.totalUserNumber },
        {
          label: 'Available Users',
          value: this.userNumber - this.totalUserNumber
        }
      ]
    },
    totalUserNumber: {
      get() {
        const totalNum = this.activeUserNumber + this.pendingUserNumber
        if (totalNum !== 'NaN') return totalNum
        return 0
      },
      // This is to avoid an occasional console warning
      set() {
        return
      }
    },
    memberMessage() {
      if (this.activePlan && this.activePlan.name.includes('Scheduler')) {
        return 'If you want to add more members, you can upgrade your account by clicking on Change Plan.'
      }
      return ''
    },
    flowMessage() {
      return ''
    },
    isMobile() {
      return this.$vuetify.breakpoint.xsOnly
    },
    userNumber() {
      if (this.activePlan && this.activePlan.terms) {
        return this.activePlan.terms.users
      }
      return 0
    },
    flowNumber() {
      if (this.activePlan && this.activePlan.terms) {
        return this.activePlan.terms.flows
      }
      return 0
    },
    flowRunRetention() {
      if (this.activePlan && this.activePlan.terms) {
        return this.activePlan.terms.history_retention_days
      }
      return 0
    },
    planPrice() {
      if (this.activePlan.name.includes('Scheduler')) {
        return 'Free'
      }
      if (
        this.activePlan &&
        this.activePlan.stripe_subscription &&
        this.activePlan.stripe_subscription.plan &&
        this.activePlan.stripe_subscription.plan.amount
      ) {
        const price = this.activePlan.stripe_subscription.plan.amount / 100
        return `$${price}/month`
      }
      return 'Custom'
    },
    isTenantAdmin() {
      return this.tenant.role === 'TENANT_ADMIN'
    }
    // formattedInvoiceDate() {
    //   if (!this.upcomingInvoiceDate) return null
    //   return moment(this.upcomingInvoiceDate).format('MMMM Do')
    // },
    // formattedDaysToInvoice() {
    //   if (!this.upcomingInvoiceDate) return null
    //   return new moment().to(moment(this.upcomingInvoiceDate))
    // },
    // estimatedNextPayment() {
    //   if (!this.billingInfo) return
    //   return this.planPrice == 0
    //     ? 'No charge'
    //     : `${this.planPrice.toLocaleString()}`
    // }
  },
  watch: {
    pendingUserNumber: function() {
      this.totalUserNumber = this.activeUserNumber + this.pendingUserNumber
    }
  },
  mounted() {
    this.refetchQueries()
  },
  methods: {
    ...mapActions('license', ['getLicense']),
    refetchQueries() {
      this.$apollo.queries.flow_aggregate.refetch()
      this.$apollo.queries.tenantUsers.refetch()
      this.$apollo.queries.pendingInvitations.refetch()
    },
    goToBilling() {
      if (!this.isTenantAdmin) return
      this.$router.push({
        name: 'change-plan',
        params: { tenant: this.tenant.slug }
      })
    },
    licenseIcon(name) {
      let icon = ''
      switch (name) {
        case 'plan':
          icon = 'attach_money'
          break
        case 'platform':
          icon = 'timeline'
          break
        case 'users':
          icon = 'person'
          break
        case 'flow_run_retention_days':
          icon = 'history'
          break
        case 'payment_method':
          icon = 'credit_card'
          break
      }
      return icon
    },
    licenseAccentColor(name) {
      let color = ''
      switch (name) {
        case 'plan':
          color = '#2edaff'
          break
        case 'platform':
          color = '#27b1ff'
          break
        case 'users':
          color = '#f77062'
          break
        case 'flow_run_retention_days':
          color = '#2F383F'
          break
        case 'payment_method':
          color = '#9575CD'
          break
      }
      return color
    },
    _refresh() {
      this.show = false
      setTimeout(() => {
        this.show = true
      }, 250)
    },
    licenseSubtitle(name) {
      let title = ''
      switch (name) {
        case 'plan':
          title = this.plan
          break
        case 'platform':
          title = 'Flows'
          break
        case 'users':
          title = 'Users'
          break
        case 'flow_run_retention_days':
          title = 'History Retention'
          break
        case 'payment_method':
          title = 'Payment Method'
          break
      }
      return title
    },
    licenseTitle(name) {
      let title = ''
      switch (name) {
        case 'plan':
          title = this.planPrice.toLocaleString()
          break
        case 'platform':
          title = this.flowNumber.toLocaleString()
          break
        case 'users':
          title = this.userNumber.toLocaleString()
          break
        case 'flow_run_retention_days':
          title = this.flowRunRetention
            ? `${this.flowRunRetention} days`
            : 'Unlimited'
          break
        // case 'payment_method':
        //   title =
        //     this.plan == 'Prefect Scheduler' || !this.licenseIsActive
        //       ? 'N/A'
        //       : '••• 3333'
        //   break
      }
      return title
    }
    // round: val => {
    //   return (Math.ceil(val * 100) / 100) * 100
    // },
    // interpolate(total, ref) {
    //   let interval,
    //     i = total / 200

    //   interval = setInterval(() => {
    //     if (this[ref] + i >= total) {
    //       this[ref] = total
    //       clearInterval(interval)
    //     } else {
    //       this[ref] += Math.ceil(i)
    //     }
    //   }, 10)
    // }
  },
  apollo: {
    // upcomingInvoiceDate: {
    //   query: require('@/graphql/Billing/upcomingInvoiceDate.gql')
    // },
    flow_aggregate: {
      query: require('@/graphql/Billing/Flows.gql'),
      result({ data }) {
        if (data && data.flow_aggregate) {
          this.usedFlows = data.flow_aggregate.aggregate.count
        }
      }
    },
    tenantUsers: {
      query: require('@/graphql/Tenant/tenant-users.gql'),
      result({ data }) {
        if (data && data.tenantUsers) {
          this.activeUserNumber = data.tenantUsers.length
        }
      }
    },
    pendingInvitations: {
      query: require('@/graphql/License/membership-invitations-count.gql'),
      variables() {
        return { tenantId: this.tenant.id }
      },
      result({ data }) {
        if (
          data &&
          data.pendingInvitations &&
          data.pendingInvitations[0] &&
          data.pendingInvitations[0].membership_invitations_aggregate &&
          data.pendingInvitations[0].membership_invitations_aggregate.aggregate
        ) {
          this.pendingUserNumber =
            data.pendingInvitations[0].membership_invitations_aggregate.aggregate.count
        }
      }
    }
  }
}
</script>

<template>
  <ManagementLayout>
    <template v-slot:title>Account Information</template>

    <template v-slot:subtitle>
      Here you can view billing details and usage metrics for your Prefect Cloud
      account.
      <!-- <div
        >You can also change your license plan or clear all the data from your
        account.</div
      > -->
    </template>

    <!-- <template v-slot:cta>
      <v-btn
        :disabled="!isTenantAdmin"
        color="primary"
        dark
        large
        depressed
        @click="goToBilling"
      >
        Change Plan
      </v-btn>
    </template> -->
    <!-- <template v-slot:cta2>
      <v-btn
        :disabled="!isTenantAdmin"
        color="red"
        large
        text
        @click="clearDataDialog = true"
      >
        Clear Data
      </v-btn>
    </template> -->

    <div v-if="billingInfo && isTenantAdmin">
      <v-row class="summary-row" justify="space-around">
        <v-col cols="12">
          <v-container>
            <v-row justify="space-around">
              <v-col class="mb-5 pa-1" cols="12" xl="6">
                <ChartCard
                  title="Flows"
                  chart-type="ring"
                  :chart-data="flowRingSegments"
                  :chart-overlay-main="`${usedFlows}`"
                  chart-overlay-overline="Flows"
                  :chart-overlay-sub="`of ${flowNumber.toLocaleString()}`"
                  chart-overlay-center="timeline"
                  :subtitle="`${usedFlows} / ${flowNumber.toLocaleString()}`"
                  :body="flowMessage"
                  :accent-color="licenseAccentColor('platform')"
                />
              </v-col>
              <v-col class="my-5 pa-1" cols="12" xl="6">
                <ChartCard
                  title="Users"
                  chart-type="ring"
                  :chart-data="userRingSegments"
                  :chart-overlay-main="`${totalUserNumber.toLocaleString()}`"
                  chart-overlay-overline="Users"
                  :chart-overlay-sub="`of ${userNumber.toLocaleString()}`"
                  chart-overlay-center="person"
                  :subtitle="
                    `${totalUserNumber.toLocaleString()} / ${userNumber.toLocaleString()}`
                  "
                  :body="memberMessage"
                  :accent-color="licenseAccentColor('users')"
                />
              </v-col>

              <!-- <v-col
                  v-if="
                    !plan.includes('Scheduler') &&
                      formattedDaysToInvoice &&
                      estimatedNextPayment &&
                      formattedInvoiceDate
                  "
                  class="my-5"
                  cols="12"
                  xl="6"
                >

                  <ChartCard
                    title="Next Invoice"
                    :subtitle="formattedDaysToInvoice"
                    chart-type="simple"
                    :chart-overlay-main="estimatedNextPayment"
                    chart-overlay-overline="Next Payment"
                    :chart-overlay-sub="formattedInvoiceDate"
                    chart-overlay-center="attach_money"
                    body="Date and estimated cost of your next invoice."
                    :accent-color="'rgb(7, 231, 152)'"
                  />
                </v-col> -->
            </v-row>
          </v-container>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-container>
            <v-row justify="space-around">
              <v-col class="my-5" cols="12" lg="4" md="6">
                <IconicCard
                  :icon="licenseIcon('plan')"
                  :title="licenseTitle('plan')"
                  :subtitle="licenseSubtitle('plan')"
                  :accent-color="licenseAccentColor('plan')"
                />
              </v-col>
              <v-col class="my-5" cols="12" lg="4" md="6">
                <IconicCard
                  :icon="licenseIcon('platform')"
                  :title="licenseTitle('platform')"
                  :subtitle="licenseSubtitle('platform')"
                  :accent-color="licenseAccentColor('platform')"
                />
              </v-col>

              <v-col class="my-5" cols="12" lg="4" md="6">
                <IconicCard
                  :icon="licenseIcon('users')"
                  :title="licenseTitle('users')"
                  :subtitle="licenseSubtitle('users')"
                  :accent-color="licenseAccentColor('users')"
                />
              </v-col>

              <v-col class="my-5" cols="12" lg="4" md="6">
                <IconicCard
                  :icon="licenseIcon('flow_run_retention_days')"
                  :title="licenseTitle('flow_run_retention_days')"
                  :subtitle="licenseSubtitle('flow_run_retention_days')"
                  :accent-color="licenseAccentColor('flow_run_retention_days')"
                />
              </v-col>
              <!-- <v-col class="my-5" cols="12" lg="4" md="6">
                  <IconicCard
                    :disabled="
                      plan == 'Prefect Scheduler' || !billingInfo.active
                    "
                    :icon="licenseIcon('payment_method')"
                    :title="licenseTitle('payment_method')"
                    :subtitle="licenseSubtitle('payment_method')"
                    :accent-color="licenseAccentColor('payment_method')"
                  />
                </v-col> -->
            </v-row>
          </v-container>
        </v-col>
      </v-row>
    </div>

    <div v-else>
      <v-alert
        class="mx-auto"
        border="left"
        colored-border
        elevation="2"
        :type="isTenantAdmin ? 'info' : 'warning'"
        :icon="isTenantAdmin ? null : 'lock'"
        tile
        max-width="600"
      >
        {{
          isTenantAdmin
            ? 'It looks like you are on a custom license. Please contact help@prefect.io for help with your billing information.'
            : 'Only Team Administrators have access to the billing information page.'
        }}
      </v-alert>
    </div>
    <!-- <ClearDataDialog
      v-if="role == 'TENANT_ADMIN'"
      :show.sync="clearDataDialog"
      @cleared="_refresh"
    /> -->
  </ManagementLayout>
</template>

<style lang="scss">
a {
  text-decoration: none;
}

.container {
  .remove-border {
    padding: 5px !important;
  }
}

.summary-card {
  height: 400px;
  margin: 50px;
  width: 400px;

  .card-body {
    height: 300px;
    position: relative;

    .ring-label {
      left: 52%;
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
    }
  }
}

.summary-row {
  position: relative;
  top: -20px;
}
</style>
