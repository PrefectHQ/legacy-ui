import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
    query DataToClear {
      project {
        id
      }

      flow(distinct_on: version_group_id, where: { archived: { _eq: false } }) {
        id
      }

      
      ${
        isCloud
          ? `
          secret_names

          memberships: user_view_same_tenant {
            id
            account_type

            memberships {
                id
              }
          }

          membershipInvitations: membership_invitation {
            id
          }

          api_token {
            id
          }

          `
          : ''
      }

    }
`
}
