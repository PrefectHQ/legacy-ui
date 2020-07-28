import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
    query Flows(
      $limit: Int
      $offset: Int
      $orderBy: [flow_order_by!]
      $searchParams: flow_bool_exp
    ) {
    flow(
        where: $searchParams
        limit: $limit
        offset: $offset
        order_by: $orderBy
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

      flow_group {
        id
        created
        name
        schedule
      }

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
    }
`
}
