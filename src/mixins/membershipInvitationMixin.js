export const handleMembershipInvitations = {
  methods: {
    async acceptMembershipInvitation(id) {
      await this.$apollo.mutate({
        mutation: require('@/graphql/Tenant/accept-membership-invitation.gql'),
        variables: {
          membershipInvitationId: id
        }
      })
    },
    async declineMembershipInvitation(id) {
      await this.$apollo.mutate({
        mutation: require('@/graphql/Tenant/delete-membership-invitation.gql'),
        variables: {
          membershipInvitationId: id
        }
      })
    }
  }
}
