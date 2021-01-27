import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
    query Flow($id: uuid!) {
      flow_group_by_pk(id: $id) {
        id
        labels
        created
        name
        default_parameters
        schedule
        flows {
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
          run_config
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
