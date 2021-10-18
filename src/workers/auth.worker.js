import {
  authorize,
  refreshTokens,
  authorizeTenant
} from '@/auth/authorization.js'
import jwt_decode from 'jwt-decode'

const ports = []
const channelPorts = []

/*
    values in the tokens Array<Object> take the form:
    
    interface TenantTokens {
        tenantId: string
        authorizationToken: string
        refreshToken: string
    }

*/
const state = {
  idToken: null,
  authorizationToken: null,
  tenantId: null
}

const postToConnections = payload => {
  for (let i = 0; i < ports.length; ++i) {
    ports[i].postMessage(payload)
  }
}

const postToChannelPorts = payload => {
  for (let i = 0; i < ports.length; ++i) {
    channelPorts[i]?.postMessage(payload)
  }
  channelPorts.length = 0
}

console.connect = payload => {
  // eslint-disable
  console.groupCollapsed('Auth worker trace', payload)
  console.log(payload)
  console.trace()
  console.groupEnd()
  // eslint-enable

  for (let i = 0; i < ports.length; ++i) {
    ports[i].postMessage({
      type: 'console',
      payload: payload
    })
  }
}

const refreshAuthorizationToken = async () => {
  const authorizationResponse = await refreshTokens(
    state.authorizationToken.access_token,
    state.authorizationToken.refresh_token
  )

  setAuthorizationToken(authorizationResponse)
}

const handleSwitchTenant = async tenantId => {
  const authorizationResponse = await authorizeTenant(
    state.authorizationToken.access_token,
    tenantId
  )

  setAuthorizationToken(authorizationResponse)

  postToConnections({
    type: 'switch-tenant',
    payload: { token: state.authorizationToken, tenantId: tenantId }
  })

  console.connect({
    message: 'handleSwitchTenant',
    tokenExpiration: state.authorizationToken.expires_at || 'No token',
    tenantId: tenantId,
    currentTime: Date.now()
  })
}

let authorizationTimeout = null
const setAuthorizationToken = token => {
  clearTimeout(authorizationTimeout)
  state.authorizationToken = token

  postToChannelPorts({
    type: 'authorizationToken',
    payload: state.authorizationToken
  })

  postToConnections({
    type: 'authorizationToken',
    payload: state.authorizationToken
  })

  try {
    const expiration = new Date(token.expires_at)
    const timeout = ((expiration - Date.now()) * 3) / 4

    console.connect({
      message: 'setAuthorizationToken',
      tokenExpiration: token.expires_at || 'No token',
      currentTime: new Date().toString()
    })
    authorizationTimeout = setTimeout(() => {
      refreshAuthorizationToken()
    }, timeout || 15000)
  } catch (e) {
    clearTimeout(authorizationTimeout)
    postToConnections({ type: 'error', payload: e })
  }
}

const handleLogin = async () => {
  console.connect({
    message: 'handleLogin',
    tokenExpiration: state.idToken?.expiresAt
      ? state.idToken.expiresAt * 1000
      : 'No Token',
    currentTime: new Date().toString()
  })

  postToChannelPorts({ payload: state.idToken })
}

const handleLogout = () => {
  state.idToken = null
  state.authorizationToken = null
  postToConnections({ type: 'logout' })
  console.connect({
    message: 'handleLogout',
    tenantId: state.tenantId,
    currentTime: new Date().toString()
  })
}

const handleClear = () => {
  state.idToken = null
  state.authorizationToken = null
  console.connect({
    message: 'handleClear',
    tenantId: state.tenantId || 'No tenant',
    currentTime: new Date().toString()
  })
}

let authorizing = false
const handleAuthorize = async idToken => {
  authorizing = true
  if (
    !state.authorizationToken ||
    new Date(state.authorizationToken.expires_at) <= Date.now()
  ) {
    const authorizationResponse = await authorize(idToken)

    setAuthorizationToken(authorizationResponse)
  }

  postToChannelPorts({ payload: state.authorizationToken })
  authorizing = false
}

const connect = c => {
  const port = c.ports[0]
  ports.push(port)

  port.onmessage = async e => {
    try {
      const type = e.data?.type
      const channelPort = e.ports[0]
      const payload = e.data?.payload

      if (type == 'login') {
        channelPorts.push(channelPort)
        await handleLogin()
      }

      if (type == 'idToken') {
        state.idToken = payload
      }

      if (type == 'logout') {
        handleLogout()
      }

      if (type == 'authorize') {
        channelPorts.push(channelPort)
        if (!authorizing) {
          await handleAuthorize(payload)
        }
      }

      if (type == 'switch-tenant') {
        channelPorts.push(channelPort)
        await handleSwitchTenant(payload)
      }

      if (type == 'clear') {
        handleClear()
      }
    } catch (e) {
      postToConnections({ type: 'error', payload: e })
    }
  }

  port.start() // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
}

self.onconnect = connect

self.onerror = e => {
  // eslint-disable-next-line no-console
  console.log('in error handler', e)
  console.connect({
    message: 'error',
    error: e
  })
}
