<script>
import { mapGetters } from 'vuex'
import { featureTypes } from '@/utils/features'
import NewLicenseAlert from '@/components/License/NewLicenseAlert'

export default {
  components: {
    NewLicenseAlert
  },
  data() {
    return {
      allFeatures: featureTypes,
      loading: false
    }
  },
  computed: {
    ...mapGetters('license', ['license']),
    ...mapGetters('tenant', ['tenant']),
    isTenantAdmin() {
      return true
    },
    planColor() {
      if (this.license?.terms?.plan == 'SELF_SERVE') return 'primary'
      if (this.license?.terms?.plan == 'PLATFORM') return 'cloudUIPrimaryBlue'
      return 'codeBlueBright'
    },
    planType() {
      if (this.license?.terms?.plan == 'SELF_SERVE') return 'Cloud Developer'
      if (this.license?.terms?.plan == 'PLATFORM') return 'Cloud Enterprise'
      return 'Custom'
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
  <v-card
    tile
    max-width="720"
    class="mx-auto my-4"
    data-cy="license-card"
    :loading="loading"
  >
    <v-card-title v-if="!license.terms.is_usage_based">
      <NewLicenseAlert :license="license" />
    </v-card-title>
    <v-card-title>
      Your plan
    </v-card-title>
    <v-card-subtitle class="pb-0">
      Your team is on
      {{ planType !== 'Custom' ? 'the Prefect' : 'a' }}
      <a href="https://www.prefect.io/get-prefect#pricing" target="_blank">
        <v-icon
          v-if="planType !== 'Custom'"
          :color="planColor"
          class="mr-1 pb-1"
          x-small
        >
          cloud
        </v-icon>
        <span :class="`${planColor}--text`">{{ planType }}</span>
      </a>
      plan.
      <br />
      <a href="https://www.prefect.io/get-prefect#contact" target="_blank">
        Contact us</a
      >
      to change your plan or to get access to cool new features!
    </v-card-subtitle>
    <v-card-text v-if="isTenantAdmin">
      <div class="d-flex flex-wrap mt-6">
        <div
          class="d-flex justify-start align-start py-4 px-8 my-2"
          style="width: 50%;"
        >
          <div class="mr-4">
            <v-icon color="primary" large style="width: 36px;">
              fas fa-user{{ userNum > 1 ? 's' : '' }}
            </v-icon>
          </div>
          <div>
            <div class="text-h6 mb-2 grey--text text--darken-3">
              {{ userNum ? userNum : 'Unlimited' }} {{ userOrUsers }}
            </div>
            <div v-if="userNum" class="text-body-1">
              You can invite up to {{ userNum }} full {{ userOrUsers }}.
            </div>
            <div v-else class="text-body-1">
              You have unlimited full users!
            </div>
          </div>
        </div>

        <div
          class="d-flex justify-start align-start py-4 px-8 my-2"
          style="width: 50%;"
        >
          <div class="mr-4">
            <v-icon color="primary" large style="width: 36px;">
              fa-glasses
            </v-icon>
          </div>
          <div>
            <div class="text-h6 mb-2 grey--text text--darken-3">
              {{ readNum ? readNum : 'Unlimited' }} read-only
              {{ readOnlyUserOrUsers }}
            </div>
            <div v-if="readNum" class="text-body-1">
              You can invite up to {{ readNum }} read-only
              {{ readOnlyUserOrUsers }}.
            </div>
            <div v-else class="text-body-1">
              You have unlimited read-only users!
            </div>
          </div>
        </div>

        <div
          class="d-flex justify-start align-start py-4 px-8 my-2"
          style="width: 50%;"
        >
          <div class="mr-4">
            <v-icon color="primary" large>pi-flow</v-icon>
          </div>
          <div>
            <div class="text-h6 mb-2 grey--text text--darken-3">
              {{
                flowConcurrency
                  ? `${flowConcurrency} concurrent ${flowOrFlows}`
                  : 'Unlimited concurrency'
              }}
            </div>
            <div v-if="flowConcurrency" class="text-body-1">
              You can have {{ flowConcurrency }} {{ flowOrFlows }} running at a
              time.
            </div>
            <div v-else class="text-body-1">
              You can run as many concurrent flows as you'd like!
            </div>
          </div>
        </div>

        <div
          class="d-flex justify-start align-start py-4 px-8 my-2"
          style="width: 50%;"
        >
          <div class="mr-4">
            <v-icon color="primary" large>history</v-icon>
          </div>
          <div>
            <div class="text-h6 mb-2 grey--text text--darken-3">
              {{
                historyRetention ? historyRetention + ' days of ' : 'Unlimited'
              }}
              history
            </div>
            <div v-if="historyRetention" class="text-body-1">
              You can view flow and task run history for up to
              {{ historyRetention }} days.
            </div>
            <div v-else class="text-body-1">
              You can view run history forever!
            </div>
          </div>
        </div>
      </div>

      <!-- <div class="text-h5 mb-4 mt-10 grey--text text--darken-4">
        {{
          planType == 'Cloud Enterprise'
            ? 'Also included with your plan'
            : 'Upgrade your plan to access these great features...'
        }}
      </div>

      <div v-if="features" class="d-flex flex-wrap">
        <div
          v-for="(item, i) in features"
          :key="i"
          class="d-flex justify-start align-start py-4 px-8 my-2"
          style="width: 50%;"
        >
          <div class="mr-4">
            <v-icon :color="colorType(item.type)" large>
              {{ iconType(item.type) }}
            </v-icon>
          </div>
          <div>
            <div class="text-h6 mb-2 grey--text text--darken-3">
              {{ titleType(item.type) }}
            </div>
            <div class="text-body-1">{{ textType(item.type) }}</div>
          </div>
        </div> -->
      <!-- </div> -->

      <!-- <div v-else class="d-flex flex-wrap">
        <div
          v-for="(item, i) in allFeatures"
          :key="i"
          class="d-flex justify-start align-start py-4 px-8 my-2"
          style="width: 50%;"
        >
          <div class="mr-4">
            <v-icon :color="item.color" large>{{ iconType(item.type) }}</v-icon>
          </div>
          <div>
            <div class="text-h6 mb-2 grey--text text--darken-3">
              {{ titleType(item.type) }}
            </div>
            <div class="text-body-1">{{ textType(item.type) }}</div>
          </div>
        </div> -->

      <!-- <div
          class="d-flex justify-start align-start py-4 px-8 my-2"
          style="width: 50%;"
        >
          <div>
            <div class="text-h6 ml-6 mb-2 grey--text text--darken-3">
              ... and more coming soon!
            </div>
          </div>
        </div>
      </div> -->
    </v-card-text>
  </v-card>
</template>

<style scoped>
.capitalize {
  text-transform: capitalize;
}

a {
  text-decoration: none;
}
</style>
