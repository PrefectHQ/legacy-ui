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

        auto_scheduled
        context
        end_time
        flow_id
        name
        parameters
        scheduled_start_time
        start_time
        state
        state_message
        state_timestamp
        parameters
        context
        agent_id

        states {
          id
          state
        }

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
