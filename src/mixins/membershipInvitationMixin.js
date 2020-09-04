export const handleMembershipInvitations = {
  methods: {
    async acceptMembershipInvitation(id) {
      const { data } = await this.$apollo.mutate({
        mutation: require('@/graphql/Tenant/accept-membership-invitation.gql'),
        variables: {
          membershipInvitationId: id
        }
      })
      return data
    },
    async declineMembershipInvitation(id) {
      const { data } = await this.$apollo.mutate({
        mutation: require('@/graphql/Tenant/delete-membership-invitation.gql'),
        variables: {
          membershipInvitationId: id
        }
      })
      return data
    }
  }
}
