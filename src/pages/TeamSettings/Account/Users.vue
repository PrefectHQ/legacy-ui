<script>
import { teamProfileMixin } from '@/mixins/teamProfileMixin.js'
import UpgradeAlert from '@/components/License/UpgradeAlert'
// import { paymentMixin } from '@/mixins/paymentMixin.js'
import { mapGetters, mapActions } from 'vuex'
import LogRocket from 'logrocket'

export default {
  components: { UpgradeAlert },
  mixins: [teamProfileMixin],
  data() {
    return {
      desiredUsers: null,
      show: false,
      diff: 0,
      userCost: 100,
      cardError: '',
      loading: false
    }
  },
  computed: {
    ...mapGetters('tenant', ['tenant']),
    ...mapGetters('license', ['license']),
    ...mapGetters('user', ['user']),
    users: {
      get() {
        return this.license?.terms?.users - 1
      },
      set(x) {
        return x
      }
    },
    upgradeOrDowngrade() {
      if (this.diff >= 0) return 'Upgrade'
      return 'Downgrade'
    },
    memberMembers() {
      return this.diff > 1 ? 'members' : 'member'
    },
    existingCard() {
      return this.tenant?.stripe_customer?.sources?.data[0]?.card
    },
    isSelfServe() {
      return (
        this.license?.terms?.plan === 'SELF_SERVE' ||
        this.license?.terms?.is_self_serve
      )
    },
    max() {
      return 4
    },
    numArr() {
      let numArr = []
      for (let i = 1; i < this.license?.terms?.users + this.max + 1; i += 1) {
        numArr.push(i)
      }
      return numArr
    },
    showPay() {
      return (
        this.show && this.isSelfServe && this.isTenantAdmin && !this.loading
      )
    },
    disableButton() {
      return !this.existingCard || this.diff == 0 || this.errors > 0
    },
    addOrRemove() {
      if (this.diff >= 0) return 'add'
      return 'remove'
    },
    userOrUsers() {
      return Math.abs(this.diff) === 1 ? 'user' : 'users'
    },
    desiredUserOrUsers() {
      return this.desiredUsers > 1 ? 'users' : 'user'
    },
    totalCost() {
      return (this.desiredUsers - 1) * this.userCost
    },
    planType() {
      if (this.license?.terms?.plan == 'SELF_SERVE') return 'Cloud Developer'
      if (this.license?.terms?.plan == 'PLATFORM') return 'Cloud Enterprise'
      return 'Custom'
    }
  },
  watch: {
    diff(val) {
      if (val === 0) {
        this.show = false
      }
    }
  },
  methods: {
    ...mapActions('license', ['getLicense']),
    ...mapActions('alert', ['setAlert']),
    ...mapActions('tenant', ['getTenants', 'setCurrentTenant']),
    ...mapActions('user', ['getUser']),
    handleInput(ev) {
      this.diff = ev - this.license?.terms?.users + 1
      if (this.diff != 0) this.show = true
    },
    handleChange(ev) {
      this.diff = ev - this.license?.terms?.users + 1
      if (this.diff != 0) this.show = true
      this.desiredUsers = ev + 1
    },
    async updateLicense() {
      this.loading = true
      try {
        const license = await this.$apollo.mutate({
          mutation: require('@/graphql/License/update-self-serve-cloud-license.gql'),
          variables: {
            license_id: this.license.id,
            users: this.desiredUsers,
            confirm: true
          },
          errorPolicy: 'all'
        })
        if (
          license.data &&
          license.data.update_self_serve_cloud_license?.success
        ) {
          await this.getLicense()
          this.setAlert({
            alertShow: true,
            alertMessage: 'Users updated.',
            alertType: 'Success',
            alertLink: { name: 'members' },
            linkText: this.diff > 0 ? `Invite ${this.memberMembers}` : ''
          })
          this.reset()
        } else {
          this.cardError = license.errors[0].message
          this.loading = false
        }
      } catch (e) {
        LogRocket.captureException(e, {
          extra: {
            pageName: 'users',
            stage: 'update license'
          }
        })
        this.loading = false
        this.cardError = 'There was a problem updating your license'
      }
    },
    async reset() {
      this.show = false
      this.users = this.license.terms.users - 1
      this.diff = 0

      await this.getUser()
      const tenantSlug = this.user.memberships.filter(
        membership => membership.tenant.id === this.tenant.id
      )?.tenant?.slug

      if (tenantSlug) {
        this.setCurrentTenant(tenantSlug)
      }
      this.loading = false
    }
  }
}
</script>

<template>
  <v-card data-cy="users-card" tile class="mx-auto" :loading="loading">
    <v-card-title class="mb-2 text-h4 font-weight-light">
      Add users
    </v-card-title>

    <v-card-subtitle>
      Check and update the number of users in your account. To see active
      membership information visit the
      <router-link :to="'/team/members'">
        members page
      </router-link>
      .
    </v-card-subtitle>
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
        You are on a {{ planType }} license. To change your license terms,
        please
        <a href="https://www.prefect.io/pricing#contact" target="_blank"
          >contact our sales team</a
        >
      </v-alert>

      <v-slider
        v-if="isSelfServe"
        data-cy="user-slider"
        :value="users"
        :readonly="!isTenantAdmin"
        :max="max"
        :tick-size="5"
        :tick-labels="numArr"
        ticks="always"
        @input="handleInput($event)"
        @change="handleChange($event)"
      >
      </v-slider>
    </v-card-text>
    <div v-if="showPay" clas="mt-12">
      <v-card-text>
        <UpgradeAlert :license="license" />
      </v-card-text>
      <v-card-title>
        {{ upgradeOrDowngrade }} to {{ desiredUsers }} {{ desiredUserOrUsers }}
      </v-card-title>
      <v-list hide-details>
        <v-list-item
          ><v-icon small class="pr-4">star_rate</v-icon> You'll
          {{ addOrRemove }}
          <span class="font-weight-bold mx-1">{{ Math.abs(diff) }}</span>
          {{ userOrUsers }} at
          <span class="font-weight-bold mx-1">${{ userCost }}</span> /user/month
          (<span class="font-weight-bold mr-1"
            >${{ Math.abs(diff) * userCost }}</span
          >
          total)
        </v-list-item>
        <v-list-item
          ><v-icon small class="pr-4">star_rate</v-icon> Your card
          <span v-if="existingCard" class="mx-1">
            ending in
            <span class="font-weight-bold"> {{ existingCard.last4 }}</span>
          </span>
          will now be charged
          <span class="font-weight-bold mx-1">${{ totalCost }} </span> on a
          monthly basis</v-list-item
        >

        <v-list-item
          ><div class="red--text">
            {{ cardError }}
          </div>
        </v-list-item>
      </v-list>
    </div>
    <v-alert
      v-if="!existingCard && isSelfServe && isTenantAdmin && !loading"
      class="mx-auto mb-12"
      border="left"
      colored-border
      elevation="2"
      type="warning"
      tile
      icon="lock"
      max-width="540"
      >Please enter payment details before adding users
    </v-alert>

    <v-card-actions v-if="isTenantAdmin && isSelfServe">
      <v-spacer></v-spacer>

      <v-btn
        v-if="showPay"
        color="primary"
        data-cy="add-user-button"
        :loading="loading"
        :disabled="disableButton"
        @click="updateLicense"
        >{{ addOrRemove }} {{ userOrUsers }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<style>
.v-slider--horizontal {
  cursor: pointer !important;
}

/* stylelint-disable */
.v-slider__tick-label {
  bottom: 0;
  left: 0;
  right: 0;
  top: 8px;
}
</style>
