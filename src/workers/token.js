// import VueApollo from 'vue-apollo'
// import { createApolloClient } from 'vue-cli-plugin-apollo/graphql-client'
// import store from '@/store/index'
// import { errorAfterware } from '@/vue-apollo'
// import { setContext } from 'apollo-link-context'

// import { ApolloLink } from 'apollo-link'
// import { InMemoryCache } from 'apollo-cache-inmemory'
// // import LogRocket from 'logrocket'

function isExpired(expiry) {
  return new Date().getTime() > expiry
}

function notExpired(expiry) {
  return !isExpired(expiry)
}

function aboutToExpire(expiry) {
  return notExpired(expiry) && new Date().getTime() + 5000 >= expiry
}

// const headerMiddleware = setContext((_, { headers }) => {
//   headers['X-Prefect-UI'] = true
//   headers['X-Backend'] = store.getters['api/backend']
//   headers['X-Prefect-Tenant-ID'] = store.getters['tenant/tenant'].id
//   headers['X-Prefect-User-ID'] = store.getters['user/user'].id

//   if (_.operationName == 'RefreshToken') {
//     // The refresh route requires the refresh token to be
//     // sent as the authorization header, with the
//     // access token as the body
//     return {
//       headers: {
//         ...headers,
//         authorization: `Bearer ${store.getters['auth/refreshToken']}`
//       }
//     }
//   }

//   // The login route requires that no authorization header be sent
//   if (_.operationName == 'LogIn') {
//     return {
//       headers: {
//         ...headers
//       }
//     }
//   }

//   return {
//     headers: {
//       ...headers
//     }
//   }
// })

// // Links used exclusively for auth calls e.g. login and refresh
// const link = ApolloLink.from([headerMiddleware, errorAfterware])

// export const cache = new InMemoryCache({
//   resultCaching: false
// })

// // Config
// export const defaultOptions = {
//   httpEndpoint: () => store.getters['api/url'],
//   wsEndpoint: null,
//   persisting: false,
//   websocketsOnly: false,
//   ssr: false,
//   link: link,
//   cache: cache,
//   queryDeduplication: true
// }

// // Create apollo client
// export const createApolloProvider = (options = defaultOptions) => {
//   const { apolloClient, wsClient } = createApolloClient({
//     id: 'auth',
//     ...options
//   })
//   apolloClient.wsClient = wsClient

//   // Create vue apollo provider
//   const apolloProvider = new VueApollo({
//     defaultClient: apolloClient,
//     defaultOptions: {
//       $query: {
//         errorPolicy: 'all',
//         fetchPolicy: 'cache-and-network'
//       },
//       $subscription: {
//         errorPolicy: 'all'
//       }
//     }
//   })
//   return apolloProvider
// }

// export const authApolloProvider = createApolloProvider()
// const authApolloClient = authApolloProvider.defaultClient

// const authorize = async idToken => {
//   try {
//     const result = await authApolloClient.mutate({
//       mutation: require('@/graphql/log-in.gql'),
//       variables: {
//         input: { id_token: idToken }
//       },
//       errorPolicy: 'all'
//     })

//     if (result?.data?.log_in) {
//       return result.data.log_in
//     } else if (result?.errors) {
//       if (
//         result.errors[0].message ===
//         "We get it, you're reeaally interested. Unfortunately, the timing isn't quite Prefect yet."
//       ) {
//         return null
//       } else {
//         throw new Error(result.errors[0].message)
//       }
//     }
//   } catch (error) {
//     throw new Error('Error authorizing prefectAuth', error)
//   }
// }

// const refresh = async (accessToken, src) => {
//   try {
//     console.log('Refreshing token from...', src)
//     const result = await authApolloClient.mutate({
//       mutation: require('@/graphql/refresh-token.gql'),
//       variables: {
//         input: { access_token: accessToken }
//       }
//     })

//     if (result?.data?.refresh_token) {
//       console.log('Token refreshed!')
//       return result.data.refresh_token
//     } else if (result.error) {
//       console.log("Unable to refresh token, here's the result: ", result)
//       throw new Error(result.error)
//     } else {
//       throw new Error('No token returned')
//     }
//   } catch (error) {
//     console.log('General refresh token error: ', error)
//     throw new Error('Error refreshing token in prefectRefresh', error)
//   }
// }

// authorize, refresh

setInterval(() => {
  console.log('token worker interval')

  const authorizationToken = localStorage.getItem('PREFECT_AUTHORIZATION_TOKEN')
  const refreshToken = localStorage.getItem('PREFECT_REFRESH_TOKEN')

  const authorizationTokenExpiry = localStorage.getItem(
    'PREFECT_AUTHORIZATION_TOKEN_EXPIRY'
  )
  const refreshTokenExpiry = localStorage.getItem(
    'PREFECT_REFRESH_TOKEN_EXPIRY'
  )

  const idToken = localStorage.getItem('PREFECT_ID_TOKEN')
  const idTokenExpiry = localStorage.getItem('PREFECT_ID_TOKEN_EXPIRY')

  const authRefreshRequired =
    authorizationToken && aboutToExpire(authorizationTokenExpiry)

  const validRefreshToken = refreshToken && notExpired(refreshTokenExpiry)

  const isAuthenticatedUser = idToken && notExpired(idTokenExpiry)

  console.log(authRefreshRequired, validRefreshToken, isAuthenticatedUser)
}, 2000)
