<script>
import { mapGetters } from 'vuex'
import { featureTypes } from '@/utils/features'
import { PLANS_2021 } from '@/utils/plans'
import ExternalLink from '@/components/ExternalLink'

export default {
  components: { ExternalLink },
  data() {
    return {
      allFeatures: featureTypes,
      loading: false,
      plans: Object.values(PLANS_2021)
    }
  },
  computed: {
    ...mapGetters('license', ['license']),
    ...mapGetters('tenant', ['tenant']),
    isTenantAdmin() {
      return this.tenant.role === 'TENANT_ADMIN'
    },
    isSelfServe() {
      return this.license?.terms?.is_self_serve
    },
    isLegacy() {
      return !this.license?.terms?.is_usage_based
    },
    plan() {
      return this.plans.find(planType => planType.value === this.planType)
    },
    planName() {
      if (this.isLegacy)
        return `${
          this.isSelfServe
            ? 'Developer'
            : this.planType
            ? this.planType.toLowerCase()
            : ''
        }`
      return this.plan.name
    },
    planType() {
      return this.license?.terms?.plan
    },
    runCost() {
      return this.plan?.price
    },
    planColor() {
      return 'primary'
    },
    readNum() {
      return this.license?.terms?.read_only_users?.toLocaleString()
    },
    userNum() {
      return this.license?.terms?.users?.toLocaleString()
    },
    readOnlyUserOrUsers() {
      return !this.license?.terms?.read_only_users
        ? 'users'
        : this.license?.terms?.read_only_users > 1
        ? 'users'
        : 'user'
    },
    userOrUsers() {
      return !this.license?.terms?.users
        ? 'users'
        : this.license?.terms?.users > 1
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
      return this.license?.terms?.users > 1 ? 'members' : 'member'
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
    }
  }
}
</script>

<template>
  <v-card tile data-cy="license-card" :loading="loading">
    <v-card-title class="mb-2 text-h4 font-weight-light">
      Your plan
      <v-spacer />

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
        >. <router-link :to="{ name: 'plans' }">Upgrade now</router-link> to get
        access to usage-based pricing and new features!
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
            <i class="prefect--text fad fa-clouds fa-fw fa-3x" />
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
            planType === 'FREE_2021' ||
              planType === 'STARTER_2021' ||
              planType === 'STANDARD_2021'
          "
          class="d-flex justify-start align-start py-4 px-8 my-2"
          style="width: 50%;"
        >
          <div class="mr-4">
            <i class="prefect--text fad fa-tasks fa-fw fa-3x" />
          </div>
          <div>
            <div class="text-h6 font-weight-regular utilGrayMid--text">
              10,000 free runs / month
            </div>
            <div v-if="planType !== 'FREE_2021'" class="text-body-1">
              Your first 10,000 successful runs per month are on us!
            </div>
            <div v-else class="text-body-1">
              10,000 successful runs each month!
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
                `prefect--text fad fa-user${userNum > 1 ? 's' : ''} fa-fw fa-3x`
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
            <i class="prefect--text pi-flow pi-3x pi-fw" />
          </div>
          <div>
            <div class="text-h6 font-weight-regular utilGrayMid--text">
              {{ `${flowConcurrency} concurrent ${flowOrFlows}` }}
            </div>
            <div class="text-body-1">
              You can have {{ flowConcurrency }} {{ flowOrFlows }} running at a
              time
            </div>
          </div>
        </div>

        <div
          class="d-flex justify-start align-start py-4 px-8 my-2"
          style="width: 50%;"
        >
          <div class="mr-4">
            <i class="prefect--text fad fa-history fa-fw fa-3x" />
          </div>
          <div>
            <div class="text-h6 font-weight-regular utilGrayMid--text">
              {{
                historyRetention ? historyRetention + ' days of ' : 'Unlimited'
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
</template>
