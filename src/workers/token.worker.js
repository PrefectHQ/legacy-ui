/* eslint-disable */
// eslint disable is required to get around bad babel rules for workers

import { ApolloLink } from 'apollo-link'
import { ApolloClient } from '@apollo/client/core'
import { setContext } from 'apollo-link-context'
// import { refreshQuery } from '@/graphql/refresh-token.gql'

const ports = []

const state = {
  authenticationTokens: null,
  authorizationToken: null,
  refreshToken: null
}

// const authMiddleware = setContext(async (_, { headers }) => {
//   if (_.operationName == 'RefreshToken') {
//     // The refresh route requires the refresh token to be
//     // sent as the authorization header, with the
//     // access token as the body
//     return {
//       headers: {
//         ...headers,
//         authorization: `Bearer ${state.refreshToken}`
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
// })

// const link = ApolloLink.from([authMiddleware])

const defaultOptions = {
  name: 'token-worker-client',
  httpEndpoint: 'https://cloud.prefect.io',
  // link: link,
  queryDeduplication: false,
  defaultOptions: {
    query: {
      fetchPolicy: 'network-only',
      errorPolicy: 'all'
    },
    mutate: {
      errorPolicy: 'all'
    }
  }
}

// // Create apollo client
const client = new ApolloClient(defaultOptions)

// const client = createApolloProvider().defaultClient

// let interval = null
// const restartAuthorizationInterval = () => {
//   clearInterval(interval)

//   interval = setInterval(async () => {
//     if (state.refreshToken) {
//       const result = await client.mutate({
//         mutation: refreshQuery,
//         variables: {
//           input: { access_token: state.authorizationToken }
//         }
//       })
//       // let result = { data: { refresh_token: null } }
//       postToConnections({
//         type: 'authorization',
//         payload: result.data.refresh_token
//       })
//     }
//   }, 5000)
// }

const postToConnections = payload => {
  for (let i = 0; i < ports.length; ++i) {
    ports[i].postMessage(payload)
  }
}

const connect = c => {
  const port = c.ports[0]
  ports.push(port)
  self.console.log('connected', port)

  // On new connection, publish the existing authenticationTokens, if they exist
  if (state.authenticationTokens) {
    port.postMessage({
      type: 'authentication',
      authenticationTokens: state.authenticationTokens
    })
  }

  port.onmessage = e => {
    const type = e.data?.type

    // When a connection sends new authentication tokens
    // update the worker state and publish the new tokens to all connections
    if (type == 'authentication') {
      state.authenticationTokens = e.data
      postToConnections(e.data)
      restartAuthorizationInterval()
      return
    }

    // If a logout signal is sent, unset the tokens on the worker state and
    // publish the logout event to all connections
    if (type == 'logout') {
      state.authenticationTokens = null
      state.authorizationToken = null
      state.refreshToken = null
      postToConnections({ type: 'logout' })
      return
    }
  }

  port.start() // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
}

self.onconnect = connect
onconnect = connect

const post = e => {
  console.log('trying to post mesage', e)
  postMessage(e.data)
}

addEventListener('message', post)
self.addEventListener('message', post)

console.log('worker loaded!')
