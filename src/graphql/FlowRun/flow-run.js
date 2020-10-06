import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
    query FlowRun(
      $id: uuid!
      $taskRunStates: [String!]
      $taskName: String
      $sort: order_by
      $limit: Int
      $offset: Int
    ) {
      flow_run_by_pk(id: $id) {
        id
        name
        version
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
        task_run_states: task_runs(distinct_on: state) {
          state
        }
        task_runs_aggregate(
          where: {
            state: { _in: $taskRunStates }
            task: {
              name: { _ilike: $taskName }
              auto_generated: { _eq: false }
            }
          }
        ) {
          aggregate {
            count
          }
        }
        task_runs(
          order_by: { start_time: $sort }
          where: {
            state: { _in: $taskRunStates }
            task: {
              name: { _ilike: $taskName }
              auto_generated: { _eq: false }
            }
          }
          limit: $limit
          offset: $offset
        ) {
          id
          state
          state_message
          state_result
          state_timestamp
          start_time
          end_time
          map_index
          version
          task {
            id
            name
            auto_generated
            max_retries
            retry_delay
          }
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
