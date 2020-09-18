import gql from 'graphql-tag'

export default function(isCloud) {
  return gql`
  query Agents {
    agent {
      id
      core_version
      name
      labels
      last_queried
      ${
          isCloud
            ? `
            token_name
            token_id`
            : ''
        }
      type
    }
  }`
}
