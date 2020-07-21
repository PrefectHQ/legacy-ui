<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  data() {
    return {
      loading: false,
      error: false,
      invitationId: localStorage.getItem('invitationId')
        ? localStorage.getItem('invitationId')
        : this.$route.query.invitation_id,
      membershipInvitation: null,
      errorMessage:
        'It looks like there was a problem with your invitation.  Please check the details and your account and try again.'
    }
  },
  computed: {
    ...mapGetters('user', ['user']),
    ...mapGetters('tenant', ['tenant'])
  },
  mounted: function() {
    this.$nextTick(async function acceptInvitation() {
      try {
        this.loading = true
        const { data, errors } = await this.$apollo.mutate({
          mutation: require('@/graphql/Tenant/accept-membership-invitation.gql'),
          variables: {
            membershipInvitationId: this.invitationId
          },
          errorPolicy: 'all'
        })
        if (data?.accept_membership_invitation?.id) {
          //once they accept the invitation, the invitation id is removed.
          localStorage.removeItem('invitationId')
          // Sets the tenant so that they're rerouted to the correct dashboard.
          await this.getTenant(data.acceptMembershipInvitation.id)
          this.loading = false
        } else if (errors) {
          if (errors[0].message === 'Uniqueness violation.') {
            this.errorMessage =
              'It looks like that invitation has already been accepted. Check your tenant list.'
          }
          this.loading = false
          this.error = true
        }
      } catch (e) {
        this.loading = false
        this.error = true
      }
    })
  },
  methods: {
    ...mapActions('tenant', ['getTenant']),
    async accept() {
      this.$router.push({
        name: 'dashboard',
        params: { tenant: this.tenant.slug }
      })
    },
    teamName() {
      if (this.membershipInvitation) {
        if (this.membershipInvitation[0]) {
          if (this.membershipInvitation[0].tenant) {
            return this.membershipInvitation[0].tenant.name
          }
        }
      }
      return 'your new team'
    },
    userName() {
      if (this.membershipInvitation) {
        if (this.membershipInvitation[0]) {
          if (this.membershipInvitation[0].user) {
            return this.membershipInvitation[0].user.username
          }
        }
      }
      return null
    }
  },
  apollo: {
    membershipInvitation: {
      query: require('@/graphql/Tenant/membership-invitation.gql'),
      variables() {
        return { id: this.invitationId }
      },
      pollInterval: 5000,
      update: data => data.membership_invitation,
      errorPolicy: 'all'
    }
  }
}
</script>

<template>
  <v-container v-if="$apollo.loading || loading">
    <v-progress-circular
      color="primary"
      class="position-absolute center"
      indeterminate
      size="150"
      width="10"
    />
  </v-container>
  <v-container v-else class="text-center">
    <div>
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
          <div v-if="error">
            <div> {{ errorMessage }} </div>
          </div>
          <div v-else>
            <div class="display-1">
              Welcome to Prefect Cloud {{ userName() }}
            </div>
            <div id="name" class="subtitle-1">
              Welcome to {{ teamName() }}. To join, please click below.
            </div>
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12">
          <v-btn v-if="!error && !loading" class="mr-3" @click="accept">
            Join
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-container>
</template>

<style lang="scss" scoped>
.logo {
  width: 50%;
}

.position-absolute {
  position: absolute;

  &.center {
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
}
</style>
