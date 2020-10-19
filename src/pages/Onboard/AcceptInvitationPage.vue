<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  data() {
    return {
      loadingKey: 0,
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
    loadingPage() {
      return this.loadingKey > 0
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
      loadingKey: 'loadingKey',
      pollInterval: 5000,
      update: data => data.membership_invitation_by_pk
    }
  }
}
</script>

<template>
  <v-container
    v-if="invitationError && !loadingPage"
    class="text-center fill-height px-0 py-16"
    fluid
  >
    <v-row align="center">
      <v-col class="grey--text text--lighten-5 mx-12">
        <div class="display-1">
          <span v-if="error"> {{ errorMessage }} </span>
          <span v-else>
            We can't find your membership invitation. Have you already accepted?
          </span>
        </div>
        <div>
          <v-btn
            class="mt-8"
            color="primary"
            x-large
            :to="{ name: 'dashboard' }"
          >
            Back to the dashboard!
            <v-icon right>fas fa-rocket</v-icon>
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
  <v-container v-else class="text-center fill-height px-0 py-16" fluid>
    <v-row />
    <v-row>
      <v-col>
        <div class="display-1 grey--text text--lighten-5">
          You've been invited to join {{ teamName }}!
        </div>
        <div class="subtitle grey--text text--lighten-5 mt-4">
          To accept, please click below.
        </div>
        <div class="mt-8">
          <v-btn class="mr-3" color="accentPink" dark depressed @click="accept">
            <v-icon class="pr-4">fa-user-friends</v-icon>
            Accept
          </v-btn>

          <v-btn text class="white--text" :to="{ name: 'dashboard' }">
            Not right now...
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <v-row />

    <v-row align="center">
      <v-col>
        <div class="mx-12 grey--text text--lighten-5 body-1 text--primary">
          For more information about teams in Prefect Cloud, check out
          <router-link
            to="https://docs.prefect.io/orchestration/ui/team-settings.html"
            class="link-color"
          >
            the docs!
          </router-link>
        </div>
      </v-col>
    </v-row>

    <v-row />
  </v-container>
</template>
