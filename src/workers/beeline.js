// const beeline = require("honeycomb-beeline")();
import '@babel/polyfill'
import fetch from 'node-fetch'
import { AuthenticationError } from 'apollo-server'
import { print, GraphQLError } from 'graphql'
const { promisify } = require('util')
const redis = require('redis')
const crypto = require('crypto')

const PREFECT_AUTH_URL = process.env.PREFECT_AUTH_URL || 'http://localhost:4203'
const HASURA_API_URL =
  process.env.HASURA_API_URL || 'http://localhost:3000/v1alpha1/graphql'
const HASURA_WS_URL =
  process.env.HASURA_WS_URL || 'ws://localhost:3000/v1alpha1/graphql'
const PREFECT_API_URL =
  process.env.PREFECT_API_URL || 'http://localhost:4201/graphql/'

const REDIS_HOST = process.env.PREFECT_SERVER__REDIS__HOST || 'localhost'
const REDIS_DB = 0
const redisClient = redis.createClient({
  host: REDIS_HOST,
  port: 6379,
  retry_strategy: function(options) {
    if (options.error && options.error.code === 'ENOTFOUND') {
      return new Error('The Redis server could not be found')
    }
    if (options.error && options.error.code === 'ECONNREFUSED') {
      return new Error('The Redis server refused the connection')
    }
    if (options.attempt < 10) {
      return Math.min(options.attempt * 100, 3000)
    }
  }
})

// attach an error handler to the client
redisClient.on('error', function(err) {
  console.error('Error ' + err)
})
// promise-ify redis to use with `await`
const redisGet = promisify(redisClient.get).bind(redisClient)
redisClient.select(REDIS_DB)

// Apollo link that extracts auth headers from incoming request, forwards them to the
// Prefect Auth Service, and then passes them to an HTTP link
async function getPrefectAuthInfo(beeline, context) {
  // get auth header
  const authHeader = context.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      var payload = null
      // strip "Bearer " from the header value
      const token = authHeader.substring(7)
      // hash the token for caching
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex')
      const cacheKey = `auth-service-cache:hashed-header:${hashedToken}`
      // attempt to load a cached header payload
      try {
        payload = JSON.parse(await redisGet(cacheKey))
      } catch {
        console.log(`Auth info not found in cache for header ${hashedToken}`)
      }
      // if no payload is cached, query the auth service
      if (!payload) {
        const response = await fetch(PREFECT_AUTH_URL + '/verify_token', {
          method: 'post',
          headers: { authorization: authHeader }
        })
        // if the auth service returns an error, raise it
        if (!response.ok) {
          const text = await response.text()
          throw new AuthenticationError(text)
        }
        payload = await response.json()
        // cache the resulting payload for 5 minutes
        try {
          redisClient.set(cacheKey, JSON.stringify(payload), 'EX', 60 * 5)
          console.log(`Saved auth info for header ${hashedToken} to the cache`)
        } catch {
          console.error(`Unable to cache auth info for header ${hashedToken}`)
        }
      }
      if (
        payload.hasura_headers['X-HASURA-TENANT-ID'] ||
        payload.hasura_headers['X-HASURA-USER-ID']
      ) {
        beeline.addTraceContext({
          tenant_id: payload.hasura_headers['X-HASURA-TENANT-ID'],
          user_id: payload.hasura_headers['X-HASURA-USER-ID']
        })
      }
      // return the payload
      return payload
    } catch (error) {
      throw new AuthenticationError(error)
    }
    // if there's no header, just return an empty header set
  } else {
    return {}
  }
}
function setUIContextForTrace(beeline, context) {
  beeline.addTraceContext({
    ui: context.headers['x-prefect-ui'] ? 'true' : 'false'
  })
  beeline.addTraceContext({
    interactive_api: context.headers['x-prefect-interactive-api']
      ? 'true'
      : 'false'
  })
}

export const prefectExecutor = beeline => async ({
  document,
  variables,
  context,
  info
}) => {
  let headers = {}
  setUIContextForTrace(beeline, context)
  // load auth info
  const authInfo = await getPrefectAuthInfo(beeline, context)
  // build headers
  if (authInfo.prefect_headers) {
    headers = authInfo.prefect_headers
  }
  // populate x-prefect headers
  for (let key of Object.keys(context.headers)) {
    if (key.toLowerCase().startsWith('x-prefect')) {
      headers[key] = context.headers[key]
    }
  }
  // parse GQL document
  const query = print(document)
  const spanName = info['fieldName']
  beeline.startAsyncSpan(
    {
      name: spanName
    },
    async span => {
      // issue remote query
      const fetchResult = await fetch(PREFECT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({ query, variables })
      })
      beeline.addContext({ executor: 'prefectExecutor' })
      if (query) {
        beeline.addContext({ query: query })
      }
      console.log('span start', spanName)
      beeline.finishSpan(span)
      // get result
      const result = await fetchResult.json()
      // transform error keys into GraphQLErrors as a workaround for
      // https://github.com/ardatan/graphql-tools/pull/1572
      if (result.errors) {
        for (const error of result.errors) {
          Object.setPrototypeOf(error, GraphQLError.prototype)
        }
      }
      return result
    }
  )
}

export const hasuraExecutor = beeline => async ({
  document,
  variables,
  context,
  info
}) => {
  let headers = {}
  setUIContextForTrace(beeline, context)
  // load auth info
  const authInfo = await getPrefectAuthInfo(beeline, context)
  // build headers
  if (authInfo.hasura_headers) {
    headers = authInfo.hasura_headers
  }
  // parse GQL document
  const query = print(document)
  // issue remote query
  const fetchResult = await fetch(HASURA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify({ query, variables })
  })
  // get result
  const result = await fetchResult.json()
  beeline.addContext({ executor: 'hasuraExecutor' })
  if (query) {
    beeline.addContext({ query: query })
  }
  // transform error keys into GraphQLErrors as a workaround for
  // https://github.com/ardatan/graphql-tools/pull/1572
  if (result.errors) {
    for (const error of result.errors) {
      Object.setPrototypeOf(error, GraphQLError.prototype)
    }
  }
  return result
}
// context for
export const adminContext = {
  headers: { authorization: `Bearer ${process.env.PREFECT_AUTH_TOKEN}` }
}
