import { fallbackApolloClient } from '@/vue-apollo'

const prefectAuth = async idToken => {
  try {
    const result = await fallbackApolloClient.mutate({
      mutation: require('@/graphql/log-in.gql'),
      variables: {
        input: { id_token: idToken }
      },
      errorPolicy: 'all'
    })

    if (result?.data?.log_in) {
      return result.data.log_in
    } else if (result?.errors) {
      if (
        result.errors[0].message ===
        "We get it, you're reeaally interested. Unfortunately, the timing isn't quite Prefect yet."
      ) {
        return null
      } else {
        throw new Error(result.errors[0].message)
      }
    }
  } catch (error) {
    throw new Error('Error authorizing prefectAuth', error)
  }
}

const prefectRefresh = async accessToken => {
  try {
    const result = await fallbackApolloClient.mutate({
      mutation: require('@/graphql/refresh-token.gql'),
      variables: {
        input: { access_token: accessToken }
      }
    })

    if (result?.data?.refresh_token) {
      return result.data.refresh_token
    } else if (result.error) {
      throw new Error(result.error)
    } else {
      throw new Error('No token returned')
    }
  } catch (error) {
    throw new Error('Error refreshing token in prefectRefresh', error)
  }
}

const prefectUser = async () => {
  try {
    const user = await fallbackApolloClient.query({
      query: require('@/graphql/User/user.gql'),
      fetchPolicy: 'no-cache'
    })
    return user.data.user[0]
  } catch (error) {
    throw new Error('Error retrieving user in prefectUser', error)
  }
}

const prefectTenants = async isCloud => {
  const result = await fallbackApolloClient.query({
    query: require('@/graphql/Tenant/tenants.js').default(isCloud),
    fetchPolicy: 'no-cache'
  })
  return result.data.tenant
}

export { prefectAuth, prefectRefresh, prefectUser, prefectTenants }
