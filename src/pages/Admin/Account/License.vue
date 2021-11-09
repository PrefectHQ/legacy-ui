<script>
import { mapActions, mapGetters } from 'vuex'
import { featureTypes } from '@/utils/features'
import { PLANS_2021 } from '@/utils/plans'

import ConfirmDialog from '@/components/ConfirmDialog'
import ExternalLink from '@/components/ExternalLink'

export default {
  components: { ConfirmDialog, ExternalLink },
  data() {
    return {
      allFeatures: featureTypes,
      cancelPlanDialog: false,
      cancelPlanError: false,
      cancelPlanloading: false,
      loading: false,
      loadingKey: 0,
      plans: Object.values(PLANS_2021),
      usersCount: null
    }
  },
  computed: {
    ...mapGetters('license', [
      'license',
      'planType',
      'allowedUsers',
      'hasPermission'
    ]),
    ...mapGetters('tenant', ['tenant']),
    isSelfServe() {
      return this.license?.terms?.is_self_serve
    },
    isLegacy() {
      return !this.license?.terms?.is_usage_based
    },
    freeUsersCount() {
      return PLANS_2021['free'].users
    },
    plan() {
      return this.plans.find(planType => planType.value === this.planType())
    },
    planName() {
      if (this.isLegacy)
        return `${
          this.isSelfServe
            ? 'Developer'
            : this.planType()
            ? this.planType().toLowerCase()
            : ''
        }`
      return this.plan.name
    },
    runCost() {
      return this.plan?.price
    },
    planColor() {
      return 'primary'
    },
    readNum() {
      return this.allowedUsers('read').toLocaleString()
    },
    userNum() {
      return this.allowedUsers().toLocaleString()
    },
    readOnlyUserOrUsers() {
      return !this.license?.terms?.read_only_users
        ? 'users'
        : this.license?.terms?.read_only_users > 1
        ? 'users'
        : 'user'
    },
    userOrUsers() {
      return !this.allowedUsers()
        ? 'users'
        : this.allowedUsers() > 1
        ? 'users'
        : 'user'
    },
    historyRetention() {
      return this.license?.terms?.history_retention_days?.toLocaleString()
    },
    flowConcurrency() {
      return this.license?.terms?.flow_concurrency
    },
    memberOrMembers() {
      return this.allowedUsers() > 1 ? 'members' : 'member'
    },
    flowOrFlows() {
      return !this.license?.terms?.flow_concurrency
        ? 'flows'
        : this.license?.terms?.flow_concurrency > 1
        ? 'flows'
        : 'flow'
    },
    features() {
      const featuresArray = this.license?.terms?.permissions?.filter(
        permission => permission.includes('feature')
      )
      const featuresObjArray = featuresArray?.map(feature => {
        let featureText = feature.split(':')[1]
        return { type: featureText }
      })
      return featuresObjArray?.length > 0 ? featuresObjArray : null
    },
    taskRuns() {
      return this.license?.terms?.task_runs_usage_limit || this.plan?.taskRuns
    }
  },
  methods: {
    ...mapActions('license', ['getLicense']),
    ...mapActions('tenant', ['getTenants']),
    ...mapActions('alert', ['setAlert']),
    colorType(type) {
      const feature = featureTypes.find(f => f.type == type)
      if (feature) return feature.color
      return 'primary'
    },
    iconType(type) {
      const feature = featureTypes.find(f => f.type == type)
      if (feature) return feature.icon
      return 'grade'
    },
    titleType(type) {
      const feature = featureTypes.find(f => f.type == type)
      if (feature) return feature.title
      return type
    },
    textType(type) {
      const feature = featureTypes.find(f => f.type == type)
      if (feature) return feature.text
      return ''
    },
    linkType(type) {
      const feature = featureTypes.find(f => f.type == type)
      if (feature) return feature.link
      return ''
    },
    async cancelPlan() {
      this.cancelPlanloading = true
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/License/create-usage-based-license.gql'),
          variables: {
            input: {
              tenant_id: this.tenant.id,
              plan_name: PLANS_2021['free'].value
            }
          }
        })
        if (data.create_self_serve_usage_license.id) {
          await this.getLicense()
          await this.getTenants()

          this.cancelPlanDialog = false

          this.setAlert(
            {
              alertShow: true,
              alertMessage: 'Your account has been downgraded.',
              alertType: 'success'
            },
            3000
          )
        }
      } catch (e) {
        this.cancelPlanError = true
      } finally {
        this.cancelPlanloading = false
      }
    }
  },
  apollo: {
    memberships: {
      query: require('@/graphql/TeamSettings/memberships.gql'),
      loadingKey: 'loadingKey',
      result({ data }) {
        if (!data) return
        this.usersCount =
          data.memberships.length + data.membershipInvitations.length
      },
      fetchPolicy: 'no-cache'
    }
  }
}
</script>

<template>
  <div>
    <v-card tile data-cy="license-card" :loading="loading">
      <v-card-title class="mb-2 text-h4 font-weight-light">
        Your plan
        <v-spacer />

        <v-btn
          v-if="
            isSelfServe &&
              !planType('FREE') &&
              hasPermission('create', 'license') &&
              hasPermission('delete', 'license')
          "
          class="mr-1 blue-grey--text"
          text
          small
          @click="cancelPlanDialog = true"
        >
          Cancel plan
        </v-btn>

        <v-btn
          v-if="isSelfServe"
          color="accentPink"
          depressed
          dark
          small
          :to="'/plans'"
        >
          Upgrade
        </v-btn>
      </v-card-title>

      <v-card-subtitle class="pb-0">
        You're on
        {{ !isLegacy ? 'the' : 'a' }}
        <v-icon :color="planColor" class="mr-1 pb-1" x-small>
          cloud
        </v-icon>
        <span :class="`${planColor}--text`" class="text-capitalize"
          >{{ planName
          }}<span v-if="isLegacy" class="text-none"> (legacy)</span></span
        >
        plan<span v-if="isLegacy && isSelfServe"
          >. <router-link :to="'/plans'">Upgrade now</router-link> to get access
          to usage-based pricing and new features!
        </span>
        <br />
      </v-card-subtitle>
      <v-card-text>
        <div class="d-flex flex-wrap mt-4">
          <div
            class="d-flex justify-start align-start py-4 px-8 my-2"
            style="width: 50%;"
          >
            <div class="mr-4">
              <i class="primary--text fad fa-clouds fa-fw fa-3x" />
            </div>
            <div>
              <div
                class="text-h6 font-weight-regular text-capitalize utilGrayMid--text"
              >
                {{ planName
                }}<span class="text-none">
                  {{ isLegacy ? '(legacy)' : '' }} plan
                </span>
              </div>
              <div class="text-body-1">
                Visit the
                <ExternalLink href="https://prefect.io/pricing" target="_blank"
                  >pricing page</ExternalLink
                >
                for more details
              </div>
            </div>
          </div>

          <div
            v-if="
              planType('FREE') || planType('STARTER') || planType('STANDARD')
            "
            class="d-flex justify-start align-start py-4 px-8 my-2"
            style="width: 50%;"
          >
            <div class="mr-4">
              <i class="primary--text fad fa-tasks fa-fw fa-3x" />
            </div>
            <div>
              <div class="text-h6 font-weight-regular utilGrayMid--text">
                20,000 free runs / month
              </div>
              <div v-if="!planType('FREE')" class="text-body-1">
                Your first 20,000 successful runs per month are on us!
              </div>
              <div v-else class="text-body-1">
                20,000 successful runs each month!
              </div>
            </div>
          </div>

          <div
            class="d-flex justify-start align-start py-4 px-8 my-2"
            style="width: 50%;"
          >
            <div class="mr-4">
              <i
                :class="
                  `primary--text fad fa-user${
                    userNum > 1 ? 's' : ''
                  } fa-fw fa-3x`
                "
              />
            </div>
            <div>
              <div class="text-h6 font-weight-regular utilGrayMid--text">
                {{ userNum ? userNum : 'Unlimited' }} {{ userOrUsers }}
              </div>
              <div v-if="userNum" class="text-body-1">
                You can invite up to {{ userNum }} {{ userOrUsers }}
              </div>
              <div v-else class="text-body-1">
                You have unlimited users!
              </div>
            </div>
          </div>

          <div
            v-if="flowConcurrency"
            class="d-flex justify-start align-start py-4 px-8 my-2"
            style="width: 50%;"
          >
            <div class="mr-4">
              <i class="primary--text pi-flow pi-3x pi-fw" />
            </div>
            <div>
              <div class="text-h6 font-weight-regular utilGrayMid--text">
                {{ `${flowConcurrency} concurrent ${flowOrFlows}` }}
              </div>
              <div class="text-body-1">
                You can have {{ flowConcurrency }} {{ flowOrFlows }} running at
                a time
              </div>
            </div>
          </div>

          <div
            class="d-flex justify-start align-start py-4 px-8 my-2"
            style="width: 50%;"
          >
            <div class="mr-4">
              <i class="primary--text fad fa-history fa-fw fa-3x" />
            </div>
            <div>
              <div class="text-h6 font-weight-regular utilGrayMid--text">
                {{
                  historyRetention
                    ? historyRetention + ' days of '
                    : 'Unlimited'
                }}
                history
              </div>
              <div v-if="historyRetention" class="text-body-1">
                Flow and task run history is retained for
                {{ historyRetention }} days
              </div>
              <div v-else class="text-body-1">
                You can view run history forever!
              </div>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <ConfirmDialog
      v-model="cancelPlanDialog"
      type="error"
      :dialog-props="{ 'max-width': '500' }"
      :disabled="cancelPlanloading || usersCount > freeUsersCount"
      :loading="cancelPlanloading"
      @confirm="cancelPlan"
    >
      <template slot="title">
        <div class="text-h5 font-weight-light">
          {{ cancelPlanError ? 'Oops' : 'Are you sure?' }}
        </div>
      </template>

      <div class="text-subtitle-1">
        <span v-if="cancelPlanError"
          >Something went wrong trying to cancel your plan. If this error
          persists, please contact help@prefect.io.</span
        >
        <span v-else
          >This will cancel your current plan and put you on the Free plan. Any
          outstanding balance will be billed immediately.</span
        >

        <v-alert
          v-if="!cancelPlanError && usersCount > freeUsersCount"
          color="warning"
          colored-border
          type="warning"
          border="left"
          tile
          class="mt-4"
        >
          You have more users than the Free plan allows (1). You'll need to
          <router-link :to="'/team/members'"
            >remove users and pending invitations</router-link
          >
          from your team before proceeding.
        </v-alert>
      </div>
    </ConfirmDialog>
  </div>
</template>
