<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  data() {
    return {
      loading: false,
      error: false,
      invitationId:
        this.$route.query.invitation_id ||
        sessionStorage.getItem('invitationId'),
      membershipInvitation: null,
      errorMessage:
        'It looks like there was a problem with your invitation.  Please check the details and your account and try again.'
    }
  },
  computed: {
    ...mapGetters('user', ['user']),
    ...mapGetters('tenant', ['tenant']),
    teamName() {
      console.log(
        'mem inv',
        this.membershipInvitation,
        'inv id',
        this.invitationId
      )
      return this.membershipInvitation?.tenant?.name || 'your new team'
    },
    userName() {
      return this.membershipInvitation[0]?.user?.username
    },
    invitationError() {
      console.log(
        'mem inv',
        this.membershipInvitation,
        'inv id',
        this.invitationId
      )
      return this.error || !this.membershipInvitation
    }
  },
  methods: {
    ...mapActions('tenant', ['setCurrentTenant']),
    async accept() {
      this.loading = true
      const tenant = this.membershipInvitation[0].tenant
      const invitationId = this.membershipInvitation[0].id
      const accepted = await this.acceptInvitation(invitationId)
      if (accepted) {
        await this.setCurrentTenant(tenant.slug)
        this.$router.push({
          name: 'dashboard',
          params: { tenant: tenant.slug }
        })
      }
    },
    async acceptInvitation(id) {
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Tenant/accept-membership-invitation.gql'),
          variables: {
            membershipInvitationId: id
          }
        })
        if (data?.accept_membership_invitation?.id) {
          return true
        }
      } catch (e) {
        this.errorMessage = e
          .toString()
          .split(':')
          .pop()
        this.loading = false
        this.error = true
      }
    }
  },
  apollo: {
    membershipInvitation: {
      query: require('@/graphql/Tenant/membership-invitation.gql'),
      variables() {
        return { id: this.invitationId }
      },
      skip() {
        return !this.invitationId
      },
      pollInterval: 5000,
      update: data => data.membership_invitation_by_pk
    }
  }
}
</script>

<template>
  <v-container v-if="$apollo.loading || loading">
    <v-progress-circular
      color="codePink"
      class="position-absolute center"
      indeterminate
      size="150"
      width="10"
    />
  </v-container>

  <v-container v-else class="text-center fill-height pa-0" fluid>
    <v-slide-x-transition>
      <div class="grey--text text--lighten-5 welcome-text">
        <div v-if="invitationError" class="display-1">
          <span v-if="error"> {{ errorMessage }} </span>
          <span v-else>
            We can't find your membership invitation. Have you already accepted?
          </span>
        </div>
        <div v-if="invitationError">
          <transition name="fade">
            <v-btn
              class="dashboard-link-absolute mt-8"
              color="primary"
              x-large
              :to="{ name: 'dashboard' }"
            >
              Back to the dashboard!
              <v-icon right>fas fa-rocket</v-icon>
            </v-btn>
          </transition>
        </div>
        <div v-else>
          <div class="display-1"> Welcome to Prefect Cloud </div>
          <div id="name" class="subtitle-1">
            You have been invited to join {{ teamName }}. To accept, please
            click below.
          </div>
        </div>
        <v-row>
          <v-col cols="12">
            <v-btn v-if="!invitationError" class="mr-3" @click="accept">
              Join
            </v-btn>
            <v-btn :to="{ name: 'dashboard' }">
              No thanks!
            </v-btn>
          </v-col>
        </v-row>
      </div>
    </v-slide-x-transition>
  </v-container>

  <!-- <v-container v-else class="text-center">
    <v-row>
      <v-col cols="12">
        <img
          class="logo"
          src="@/assets/logos/logo-full-color-horizontal.svg"
          alt="The Prefect Logo"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <div v-if="error || !membershipInvitation || !membershipInvitation[0]">
          <div>
            <span v-if="error"> {{ errorMessage }} </span>
            <span v-else>
              We can't find your membership invitation. Have you already
              accepted?
            </span>
          </div>
        </div>
        <div v-else>
          <div class="display-1"> Welcome to Prefect Cloud {{ userName }} </div>
          <div id="name" class="subtitle-1">
            Welcome to {{ teamName }}. To join, please click below.
          </div>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-btn
          v-if="
            !error &&
              !loading &&
              membershipInvitation &&
              membershipInvitation[0]
          "
          class="mr-3"
          @click="accept"
        >
          Join
        </v-btn>
      </v-col>
    </v-row>
  </v-container> -->
</template>

<style lang="scss" scoped>
.fill-height {
  height: 100vh !important;
}

.welcome-text {
  left: 50%;
  max-width: 700px;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  z-index: 1;
}

.logo {
  img {
    height: auto;
    max-width: 700px;
    width: 90%;
  }
}
</style>
