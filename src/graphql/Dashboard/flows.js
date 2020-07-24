import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
    query Flows(
      $limit: Int
      $offset: Int
      $orderBy: [flow_group_order_by!]
      $flowGroupSearchParams: flow_group_bool_exp
      $flowSearchParams: flow_bool_exp
    ) {
    flows: flow_group(
        where: $flowGroupSearchParams
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        id

        created
        name

        schedule

        flows(
          where: $flowSearchParams
        ) {
          id

          archived
          core_version
          created

          ${
            isCloud
              ? `
              created_by {
                id
                username
              }`
              : ''
          }

          description
          environment
          flow_group_id

          is_schedule_active

          name
          parameters

          project {
            id
            name
          }

          schedule

          storage

          updated
          version
          version_group_id
        }

        settings
        updated
      }
    }
`
}
