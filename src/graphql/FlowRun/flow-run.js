import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
    query FlowRun(
      $id: uuid!
    ) {
      flow_run_by_pk(id: $id) {
        id

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

        auto_scheduled
        context
        duration
        end_time
        flow_id
        name
        parameters
        scheduled_start_time
        start_time
        state
        state_message
        state_timestamp
        version


        flow {
          id
          name
          version
          version_group_id
          core_version
          project {
            id
            name
          }
        }
      }
    }
  `
}
