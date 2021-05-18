import { ApolloClient } from '@apollo/client/core'
import { HttpLink, from } from '@apollo/client'
import { onError } from 'apollo-link-error'
import { InMemoryCache } from 'apollo-cache-inmemory'

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

const link = from([
  errorAfterware,
  new HttpLink({ uri: process.env.VUE_APP_CLOUD_URL })
])

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

// // Create apollo client
export const Client = name =>
  new ApolloClient({
    name: name,
    version: '1.3',
    ...options
  })
