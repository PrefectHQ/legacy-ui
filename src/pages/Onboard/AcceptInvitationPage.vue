<script>
import { mapActions, mapGetters } from 'vuex'
import { handleMembershipInvitations } from '@/mixins/membershipInvitationMixin.js'

export default {
  mixins: [handleMembershipInvitations],
  data() {
    return {
      loadingKey: 0,
      loading: false,
      deleting: false,
      error: false,
      dialog: false,
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
      return this.membershipInvitation?.tenant?.name || 'a new team'
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
      try {
        this.loading = true
        const tenant = this.membershipInvitation.tenant
        const invitationId = this.membershipInvitation.id
        const accepted = await this.acceptMembershipInvitation(invitationId)
        if (accepted.accept_membership_invitation.id) {
          sessionStorage.removeItem('invitationId')
          await this.setCurrentTenant(tenant.slug)
          this.toDashboard(tenant)
          this.loading = false
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
    async decline() {
      try {
        this.deleting = true
        const invitationId = this.membershipInvitation.id
        const declined = await this.declineMembershipInvitation(invitationId)
        if (declined.delete_membership_invitation.success) {
          this.toDashboard()
        }
        this.deleting = false
      } catch (e) {
        this.mutationErrorMessage = e
          .toString()
          .split(':')
          .pop()
        this.dialog = false
        this.deleting = false
        this.error = true
      }
    },
    toDashboard(tenant) {
      sessionStorage.removeItem('invitationId')
      this.$router.push({
        name: 'dashboard',
        params: { tenant: tenant ? tenant.slug : this.tenant.slug }
      })
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
    class="position-absolute text-center d-flex flex-row align-center justify-center"
  >
    <div v-if="invitationError">
      <v-col class="grey--text text--lighten-5 mx-12">
        <div class="text-h4">
          <span> {{ mutationErrorMessage || errorMessage }} </span>
        </div>
        <div>
          <v-btn class="mt-8" color="primary" x-large @click="toDashboard">
            Back to the dashboard!
            <v-icon right>fas fa-rocket</v-icon>
          </v-btn>
        </div>
      </v-col>
    </div>
    <div v-else>
      <v-col>
        <div class="text-h4 grey--text text--lighten-5">
          You've been invited to join
          <span class="font-weight-bold"> {{ teamName }}</span>
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
          <v-dialog v-model="dialog" max-width="500">
            <template #activator="{ on, attrs }">
              <v-btn outlined class="white--text" v-bind="attrs" v-on="on">
                No Thanks
              </v-btn>
            </template>

            <v-card>
              <v-card-title class="text-h5">
                Are you sure you want to decline?
              </v-card-title>

              <v-card-text>
                <div
                  >Clicking <span class="font-weight-bold"> Decline </span> will
                  delete your invitation and take you back to the dashboard. </div
                ><div class="mt-2">
                  If you don't want to confirm or delete your invitation right
                  now, you can click on
                  <span class="font-weight-bold"> Dashboard</span>. You'll be
                  taken back to your team dashboard and be able to accept (or
                  decline) the invitation later.
                </div>
              </v-card-text>

              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  class="white--text"
                  color="prefect"
                  :loading="deleting"
                  @click="decline"
                >
                  Decline
                </v-btn>
                <v-btn outlined color="prefect" @click="toDashboard">
                  Dashboard</v-btn
                >
                <v-btn text color="prefect" @click="dialog = false"
                  >Cancel</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-dialog>
        </div>
      </v-col>
    </div>
  </v-container>
</template>

<style lang="scss" scoped>
.link-color {
  color: var(v-prefect-base);
}
</style>
