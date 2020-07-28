import { fallbackApolloClient } from '@/vue-apollo'

const flowNavGuard = async (to, from, next) => {
  let id = to.params?.id

  let group = await fallbackApolloClient.query({
    query: require('@/graphql/Middleware/flow-group.gql'),
    variables: {
      id: id
    }
  })

  if (group?.data?.flow_group_by_pk?.id) return next()

  let version = await fallbackApolloClient.query({
    query: require('@/graphql/Middleware/flow.gql'),
    variables: {
      id: id
    }
  })

  if (version?.data?.flow_by_pk?.flow_group_id) {
    return next({
      name: to.name,
      params: { id: version.data.flow_by_pk.flow_group_id },
      query: {
        version: version.data.flow_by_pk.version,
        ...to.query
      }
    })
  }

  return next({
    name: 'not-found'
  })
}

export default flowNavGuard
