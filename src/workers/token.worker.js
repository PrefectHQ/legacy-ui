/* eslint-disable */
// prettier-ignore
// eslint disable is required to get around bad babel rules for workers
import { ApolloClient } from '@apollo/client/core'
import { HttpLink, from } from '@apollo/client'
import { onError } from 'apollo-link-error'
import { InMemoryCache } from 'apollo-cache-inmemory'

const ports = []
const channelPorts = []

const state = {
  authenticationTokens: null,
  authorizationTokens: null
}

const cache = new InMemoryCache()

const errorAfterware = onError(
  ({ response, operation, graphQLErrors, networkError, forward }) => {
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
        console.log(response)
        console.log(graphQLErrors)
        console.groupEnd()
      }
      console.groupEnd()
      /* eslint-enable no-console */
    }

    if (response) {
      response.errors = null
    }
    
    // Can return Observable.of returned from error link to supress errors
    //  otherwise return forward(operation)
    // for a single retry of the failure
    // if (process.env.NODE_ENV !== 'production') return Observable.of()
    return forward(operation)
  }
)

const link = from([errorAfterware, new HttpLink({uri: process.env.VUE_APP_CLOUD_URL})])


const options = {
  cache: cache,
  link: link,
  queryDeduplication: false,
  defaultOptions: {
    mutate: {
      errorPolicy: 'all'
    }
  }
}


const headers = {
  'X-PREFECT-UI': true,
  'X-Backend': 'cloud'
}

// // Create apollo client
const client = new ApolloClient({name: 'token-worker-client', version: '1.3', ...options})

let interval = null
const restartAuthorizationInterval = () => {
  clearInterval(interval)

  interval = setInterval(async () => {
    if (state.authorizationTokens) {
      const result = await client.mutate({
        mutation: require('@/graphql/refresh-token.gql'),
        variables: {
          input: { access_token: state.authorizationTokens.access_token }
        },
        context: {
          headers: {
            ...headers,
            authorization: `Bearer ${state.authorizationTokens.refresh_token}`
          }
        },
        fetchPolicy: 'no-cache'
      })

      state.authorizationTokens = result.data.refresh_token
      postToConnections({
        type: 'authorization',
        payload: result.data.refresh_token
      })
    }
  }, 5000)
}



let authorizationInProgress = false
const getAuthorizationTokens = async () => {
  authorizationInProgress = true
  const result = await client.mutate({
      mutation: require('@/graphql/log-in.gql'),
      variables: {
        input: { id_token: state.authenticationTokens.idToken.value }
      },
      context: {
        headers: headers
      },
      errorPolicy: 'all',
      fetchPolicy: 'no-cache'
    })

    state.authorizationTokens = result.data.log_in
    postToChannelPorts({type: 'authorization', payload: state.authorizationTokens})
    authorizationInProgress = false
}

const postToConnections = payload => {
  for (let i = 0; i < ports.length; ++i) {
    ports[i].postMessage(payload)
  }
}

const postToChannelPorts = payload => {
  for (let i = 0; i < ports.length; ++i) {
    channelPorts[i].postMessage(payload)
  }
  channelPorts.length = 0
}

const connect = c => {
  const port = c.ports[0]
  ports.push(port)

  // On new connection, publish the existing authenticationTokens, if they exist
  if (state.authenticationTokens) {
    port.postMessage({
      type: 'authentication',
      payload: state.authenticationTokens
    })
  }

  port.onmessage = e => {
    const type = e.data?.type
    const channelPort = e.ports[0]


    // When a connection sends new authentication tokens
    // update the worker state and publish the new tokens to all connections
    if (type == 'authentication') {
      state.authenticationTokens = e.data.payload
      postToConnections(e.data)
      restartAuthorizationInterval()
      return
    }

    if (type == 'authorization') {
      // When a connection sends a request for authorization
      // we send the stored tokens back immediately, if they exist, via the attached message port;
      if (state.authorizationToken) channelPort.postMessage({type: 'authorization', payload: state.authorizationTokens})
      else {
      // otherwise we start the authorization process, which will 
      // post the retrieved tokens to all channelPorts
        channelPorts.push(channelPort)
        if (!authorizationInProgress) getAuthorizationTokens()
      }
    }

    // If a logout signal is sent, unset the tokens on the worker state and
    // publish the logout event to all connections
    if (type == 'logout') {
      state.authenticationTokens = null
      state.authorizationTokens = null
      postToConnections({ type: 'logout' })
      return
    }
  }

  port.start() // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
}

self.onconnect = connect
onconnect = connect

