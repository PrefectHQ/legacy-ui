import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`

  query Notifications(
  $limit: Int
  $offset: Int
  $orderBy: [message_order_by!]
  $where: message_bool_exp
) {
  notifications: message(
    where: $where
    limit: $limit
    offset: $offset
    order_by: $orderBy
  ) {
    content
    created
    id
    read
    content
    tenant_id
    text
    type
    updated

    ${
      isCloud
        ? `
        user {
          username
        }

        user_id
      `
        : ''
    }

  }
}
   
  `
}
