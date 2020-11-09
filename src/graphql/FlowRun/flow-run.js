import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
    query FlowRun(
      $id: uuid!
    ) {
      flow_run_by_pk(id: $id) {
        id
        name
        version
        labels
        auto_scheduled

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

        scheduled_start_time
        start_time
        end_time
        state
        state_message
        state_timestamp
        parameters
        context
        agent_id

        flow {
          id
          name
          version
          version_group_id
          core_version
          parameters
          project {
            id
            name
          }
        }
      }
    }
  `
}
