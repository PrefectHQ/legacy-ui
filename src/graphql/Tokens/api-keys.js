import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
    query ApiKeys(
      $limit: Int
    ) {
    auth_api_key(
        limit: $limit
        order_by: { created: desc }
      ) {

        id
        name
        created
        expires_at
        default_tenant_id
        user_id
        updated

      ${
        isCloud
          ? `
          created_by {
              id
              username
          }`
          : ''
      }
    }
    }
`
}