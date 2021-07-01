import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
    query Flows(
      $where: flow_bool_exp
    ) {
    flow(
        where: $where
      ) {

      id
      flow_group_id
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
