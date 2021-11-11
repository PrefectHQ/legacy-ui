import { fallbackApolloClient } from '@/vue-apollo'
import store from '@/store/index'

const flowNavGuard = async (to, from, next) => {
  const id = to.params?.id
  const flows = store.getters['data/flows']

  const group = flows?.find(flow => flow.flow_group_id == id)

  if (group) return next()

  let version
  try {
    version = await fallbackApolloClient.query({
      query: require('@/graphql/Middleware/flow.gql'),
      variables: {
        id: id
      }
    })
  } catch {
    return next({
      name: 'not-found'
    })
  }

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

  try {
    await store.dispatch('data/activateFlow', id)
    const renewedFlows = store.getters['data/flows']
    const renewedGroup = renewedFlows?.find(flow => flow.flow_group_id == id)
    if (renewedGroup) return next()
  } catch {
    return next({
      name: 'not-found'
    })
  }

  return next({
    name: 'not-found'
  })
}

export default flowNavGuard
