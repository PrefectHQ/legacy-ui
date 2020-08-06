import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
    query Versions(
      $limit: Int
      $offset: Int
      $order_by: [flow_order_by!]
      $flow_group_id: uuid!
      $search: Int
    ) {
      flow_group_by_pk(id: $flow_group_id) {
        id

        flows(
          order_by: $order_by
          where: { version: { _eq: $search } }
          limit: $limit
          offset: $offset
        ) {
          id

          archived
          created
          ${
            isCloud
              ? `
                  created_by {
            id
            username
          }
          `
              : ''
          }



          name
          version
        }
      }
    }
   
  `
}
