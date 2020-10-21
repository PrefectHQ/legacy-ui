<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  data() {
    return {
      loadingKey: 0,
      loading: false,
      deleting: false,
      start: false,
      error: false,
      invitationId:
        this.$route.query.invitation_id ||
        sessionStorage.getItem('invitationId'),
      membershipInvitation: null,
      mutationErrorMessage: false
    }
  },
  computed: {
    ...mapGetters('user', ['user']),
    ...mapGetters('tenant', ['tenant']),
    teamName() {
      return this.membershipInvitation?.tenant?.name || 'your new team'
    },
    loadingPage() {
      return this.loadingKey > 0
    },
    invitationError() {
      return (
        this.error ||
        !this.membershipInvitation ||
        !this.membershipInvitation.user ||
        this.mutationErrorMessage
      )
    },
    errorMessage() {
      if (this.membershipInvitation && !this.membershipInvitation.user)
        return 'This invitation appears to be for someone else - did you log in to the correct account?'
      if (this.error)
        return 'It looks like there was a problem with your invitation.  Please check the details and your account and try again.'
      return `We can't find this invitation... have you already
              accepted?`
    }
  },
  methods: {
    ...mapActions('tenant', ['setCurrentTenant']),
    async accept() {
      this.loading = true
      const tenant = this.membershipInvitation.tenant
      const invitationId = this.membershipInvitation.id
      const accepted = await this.acceptInvitation(invitationId)
      if (accepted) {
        sessionStorage.removeItem('invitationId')
        await this.setCurrentTenant(tenant.slug)
        this.$router.push({
          name: 'dashboard',
          params: { tenant: tenant.slug }
        })
      }
      this.loading = false
    },
    async decline() {
      this.deleting = true
      const invitationId = this.membershipInvitation.id
      const declined = await this.declineInvitation(invitationId)
      if (declined) {
        this.toDashboard()
      }
      this.deleting = false
    },
    toDashboard() {
      sessionStorage.removeItem('invitationId')
      this.$router.push({ name: 'dashboard' })
    },
    async declineInvitation(id) {
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Tenant/delete-membership-invitation.gql'),
          variables: {
            membershipInvitationId: id
          }
        })
        if (data?.delete_membership_invitation?.success) {
          return true
        }
      } catch (e) {
        this.mutationErrorMessage = e
          .toString()
          .split(':')
          .pop()
        this.loading = false
        this.error = true
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
        this.mutationErrorMessage = e
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
      update: data => data.membership_invitation_by_pk
    }
  }
}
</script>

<template>
  <v-container
    v-if="!loadingPage"
    class="position-absolute onboard-content text-center pa-0"
    fluid
  >
    <v-row v-if="invitationError" align="center">
      <v-col class="grey--text text--lighten-5 mx-12">
        <div class="display-1">
          <span> {{ mutationErrorMessage || errorMessage }} </span>
        </div>
        <div>
          <v-btn class="mt-8" color="primary" x-large @click="toDashboard">
            Back to the dashboard!
            <v-icon right>fas fa-rocket</v-icon>
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <v-row v-else align="center">
      <v-col>
        <div class="display-1 grey--text text--lighten-5">
          You've been invited to join
          <span class="font-weight-bold"> {{ teamName }}</span
          >!
        </div>
        <div class="subtitle grey--text text--lighten-5 mt-4">
          To accept, please click below.
        </div>
        <div class="mt-8">
          <v-btn
            class="mr-3"
            color="accentPink"
            dark
            depressed
            :loading="loading"
            @click="accept"
          >
            <v-icon class="pr-4">fa-user-friends</v-icon>
            Accept
          </v-btn>

          <v-btn
            outlined
            class="white--text"
            :loading="deleting"
            @click="decline"
          >
            No Thanks
          </v-btn>
        </div>
      </v-col>
    </v-row>
    <v-row align="center">
      <v-col>
        <div class="ma-12 grey--text text--lighten-5 body-1 text--primary">
          For more information about teams in Prefect Cloud, check out
          <a
            href="https://docs.prefect.io/orchestration/ui/team-settings.html"
            target="_blank"
            class="link-color"
          >
            our docs</a
          >.
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style lang="scss" scoped>
.link-color {
  color: #27b1ff;
}
</style>
