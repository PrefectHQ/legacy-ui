import Vue from 'vue'
import VueApollo from 'vue-apollo'
import {
  createApolloClient,
  restartWebsockets
} from 'vue-cli-plugin-apollo/graphql-client'
import store from '@/store/index'
import { setContext } from 'apollo-link-context'

import { ApolloLink, Observable } from 'apollo-link'

import { BatchHttpLink } from 'apollo-link-batch-http'
import { onError } from 'apollo-link-error'
import { InMemoryCache } from 'apollo-cache-inmemory'
import LogRocket from 'logrocket'

// Install the vue plugin
Vue.use(VueApollo)

// Name of the localStorage item
const AUTH_TOKEN = 'authorization_token'

function isExpired(expiry) {
  return new Date().getTime() > expiry
}

function notExpired(expiry) {
  return !isExpired(expiry)
}

function aboutToExpire(expiry) {
  return notExpired(expiry) && new Date().getTime() + 300000 >= expiry
}

let errors = 0,
  apiErrors = 0

const batchLink = new BatchHttpLink({
  batchMax: 20,
  batchInterval: 200,
  uri: () => store.getters['api/url']
})

const backendMiddleware = new ApolloLink((operation, forward) => {
  const context = operation.getContext()
  if (context.headers?.['X-Backend'] !== store.getters['api/backend']) {
    defaultApolloClient.cache.reset()
    return
  }
  return forward(operation).map(response => {
    errors = 0
    apiErrors = 0
    return response
  })
})

const headerMiddleware = setContext((_, { headers }) => {
  if (_.query && _.query.source && _.query.source == 'InteractiveAPI') {
    headers['X-Prefect-Interactive-API'] = true
  } else {
    headers['X-Prefect-UI'] = true
  }

  headers['X-Backend'] = store.getters['api/backend']

  return {
    headers: {
      ...headers
    }
  }
})

const errorAfterware = onError(
  ({ response, operation, graphQLErrors, networkError, forward }) => {
    // Only throw the API error once in a row
    // (prevents spamming the console when there's no connection)
    if (operation.operationName === 'Api') {
      if (apiErrors > 0) {
        // TODO: fix this
        Observable
        // return Observable.of()
      }
      apiErrors++
    }

    if (process.env.NODE_ENV !== 'production') {
      /* eslint-disable no-console */
      console.groupCollapsed(
        `%c${operation.operationName || 'Unnamed Query'} error`,
        'color: #D64292; font-weight:bold;'
      )
      console.log('Operation: ', operation)

      if (graphQLErrors?.length > 0) {
        console.group('%cGraphQL Errors', 'color: #CA9800; font-weight:bold;')
        graphQLErrors?.forEach(error => {
          console.group(
            `%c${error.extensions?.code || 'ERROR'}`,
            'color: #B11A04; font-weight:bold;'
          )
          console.log(`Message: ${error.message}`)
          console.log('Full log: ', error)
          console.groupEnd()
        })
        console.groupEnd()
      }

      if (networkError) {
        console.group('%cNetwork Error', 'color: #CA9800; font-weight:bold;')
        console.log(networkError)
        console.groupEnd()
      }
      console.groupEnd()
      /* eslint-enable no-console */
    }

    if (
      store.getters['api/isCloud'] &&
      graphQLErrors?.[0].message === 'Operation timed out'
    ) {
      LogRocket.captureException(operation, {
        type: 'Timeout'
      })
      // For now we just capture Cloud errors,
      // we can expand this if it's helpful for debugging later
    } else if (
      (store.getters['api/isCloud'] && graphQLErrors) ||
      networkError
    ) {
      if (graphQLErrors) {
        LogRocket.captureException(graphQLErrors, {
          type: 'GraphQL Errors'
        })
      } else if (networkError)
        LogRocket.captureException(networkError, {
          type: 'Network Error'
        })
    }

    if (response) {
      response.errors = null
    }
    errors++
    if (errors > 10) {
      defaultApolloClient.stop()
    }
    // Can return Observable.of returned from error link to supress errors
    //  otherwise return forward(operation)
    // for a single retry of the failure
    // if (process.env.NODE_ENV !== 'production') return Observable.of()
    return forward(operation)
  }
)

const authMiddleware = setContext(async (_, { headers }) => {
  if (store.getters['api/isServer']) {
    return {
      headers: {
        ...headers
      }
    }
  }

  const authRefreshRequired =
    store.getters['auth0/authorizationToken'] &&
    aboutToExpire(store.getters['auth0/authorizationTokenExpiry'])

  const validRefreshToken =
    store.getters['auth0/refreshToken'] &&
    notExpired(store.getters['auth0/refreshTokenExpiry'])

  const isAuthenticatedUser =
    store.getters['auth0/idToken'] &&
    notExpired(store.getters['auth0/idTokenExpiry'])

  const middleOfRefresh =
    store.getters['auth0/isRefreshingAuthorization'] ||
    store.getters['auth0/isAuthorizingUser'] ||
    store.getters['auth0/isLoggingInUser']

  if (
    store.getters['api/backend'] !== 'SERVER' &&
    (!store.getters['auth0/idToken'] || !isAuthenticatedUser) &&
    !store.getters['isRefreshingAuthentication']
  ) {
    return await store.dispatch('auth0/updateAuthentication')
  } else if (store.getters['isRefreshingAuthentication']) {
    // Don't fire requests while we're trying to refresh authentication
    return
  }

  if (_.operationName == 'RefreshToken') {
    // The refresh route requires the refresh token to be
    // sent as the authorization header, with the
    // access token as the body
    return {
      headers: {
        ...headers,
        authorization: `Bearer ${store.getters['auth0/refreshToken']}`
      }
    }
  }

  // The login route requires that no authorization header be sent
  if (_.operationName == 'LogIn') {
    return {
      headers: {
        ...headers
      }
    }
  }

  if (authRefreshRequired && !middleOfRefresh) {
    defaultApolloClient.cache.reset()
    if (validRefreshToken) {
      await store.dispatch('auth0/refreshAuthorization')
    } else if (isAuthenticatedUser) {
      await store.dispatch('auth0/authorize')
    } else {
      await store.dispatch('auth0/login')
    }
  }

  const bearer = `Bearer ${store.getters['auth0/authorizationToken']}`
  return {
    headers: {
      ...headers,
      authorization: bearer
    }
  }
})

// Apollo link chain; acts as middleware for GraphQL queries
const link = ApolloLink.from([
  authMiddleware,
  headerMiddleware,
  backendMiddleware,
  errorAfterware,
  batchLink
])

export const cache = new InMemoryCache({
  resultCaching: false
})

// Config
export const defaultOptions = {
  // You can use `https` for secure connection (recommended in production)
  httpEndpoint: () => store.getters['api/url'],
  // You can use `wss` for secure connection (recommended in production)
  // Use `null` to disable subscriptions
  wsEndpoint: null,
  //'ws://localhost:4300',
  // LocalStorage token
  tokenName: AUTH_TOKEN,
  // Enable Automatic Query persisting with Apollo Engine
  persisting: false,
  // Use websockets for everything (no HTTP)
  // You need to pass a `wsEndpoint` for this to work
  websocketsOnly: false,
  // Is being rendered on the server?
  ssr: false,

  // Override default apollo link
  // note: don't override httpLink here, specify httpLink options in the
  // httpLinkOptions property of defaultOptions.
  defaultHttpLink: false,
  link: link,

  // Override default cache
  cache: cache,

  // Override the way the Authorization header is set
  // getAuth: () => ...

  // Additional ApolloClient options
  // apollo: { ... }

  // Client local data (see apollo-link-state)
  // clientState: { resolvers: { ... }, defaults: { ... } }
  queryDeduplication: true
}

let defaultApolloClient
let fallbackApolloClient

// Create apollo client
export const createApolloProvider = () => {
  const { apolloClient, wsClient } = createApolloClient({
    id: 'initial',
    ...defaultOptions
  })
  apolloClient.wsClient = wsClient

  // Create vue apollo provider
  const apolloProvider = new VueApollo({
    defaultClient: apolloClient,
    defaultOptions: {
      $query: {
        errorPolicy: 'all',
        fetchPolicy: 'cache-and-network'
      },
      $subscription: {
        errorPolicy: 'all'
      }
    }
  })
  return apolloProvider
}

export const clearCache = () => {
  defaultApolloClient.cache.reset()
}

export const defaultApolloProvider = createApolloProvider()
defaultApolloClient = defaultApolloProvider.defaultClient
export { defaultApolloClient }

// This is the client we use that is not subject to the stop/restarts of the application
export const fallbackApolloProvider = createApolloProvider()
fallbackApolloClient = fallbackApolloProvider.defaultClient
export { fallbackApolloClient }
// export const fallbackApolloClient = fallbackApolloProvider.defaultClient

export async function apolloOnLogin(apolloClient) {
  if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
  await apolloClient.clearStore()
}

export async function apolloOnLogout(apolloClient) {
  if (apolloClient.wsClient) restartWebsockets(apolloClient.wsClient)
  await apolloClient.clearStore()
}
