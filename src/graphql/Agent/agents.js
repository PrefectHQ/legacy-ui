import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
  query Agents {
    agent {
      id
      agent_config_id
      core_version
      created
      name
      labels
      last_queried
      type
      ${
          isCloud
            ? `
            token_name
            token_id`
            : ''
        }
    }
  }`
}
