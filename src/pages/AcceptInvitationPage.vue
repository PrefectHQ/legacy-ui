<script>
import { mapActions, mapGetters } from 'vuex'

export default {
  data() {
    return {
      loading: false,
      error: false,
      invitationId: this.$route.query.invitation_id,
      membershipInvitation: null,
      errorMessage:
        'It looks like there was a problem with your invitation.  Please check the details and your account and try again.'
    }
  },
  computed: {
    ...mapGetters('user', ['user']),
    ...mapGetters('tenant', ['tenant']),
    teamName() {
      return this.membershipInvitation[0]?.tenant?.name || 'your new team'
    },
    userName() {
      return this.membershipInvitation[0]?.user?.username
    }
  },
  methods: {
    ...mapActions('tenant', ['getTenants', 'setCurrentTenant']),
    ...mapActions('user', ['getUser']),
    async accept() {
      this.loading = true
      const tenant = this.membershipInvitation[0].tenant
      const accepted = await this.acceptInvitation()
      if (accepted) {
        await this.setCurrentTenant(tenant.slug)
        this.$router.push({
          name: 'dashboard',
          params: { tenant: tenant.slug }
        })
        this.loading = false
      }
    },
    async acceptInvitation() {
      try {
        const { data } = await this.$apollo.mutate({
          mutation: require('@/graphql/Tenant/accept-membership-invitation.gql'),
          variables: {
            membershipInvitationId: this.invitationId
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
      pollInterval: 5000,
      update: data => {
        return data.membership_invitation
      }
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
          <div
            v-if="error || !membershipInvitation || !membershipInvitation[0]"
          >
            <div>
              {{ errorMessage }}
            </div>
          </div>
          <div v-else>
            <div class="display-1">
              Welcome to Prefect Cloud {{ userName }}
            </div>
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
