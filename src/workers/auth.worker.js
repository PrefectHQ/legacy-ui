import {
  authorize,
  refreshTokens,
  authorizeTenant
} from '@/auth/authorization.js'

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
  console.groupCollapsed('Auth worker trace', payload)
  console.log(payload)
  console.trace()
  console.groupEnd()

  for (let i = 0; i < ports.length; ++i) {
    ports[i].postMessage({ type: 'console', payload: payload })
  }
}

const refreshAuthorizationToken = async () => {
  const authorizationResponse = await refreshTokens(
    state.authorizationToken.access_token,
    state.authorizationToken.refresh_token
  )

  console.connect(authorizationResponse)

  setAuthorizationToken(authorizationResponse)
}

const handleSwitchTenant = async tenantId => {
  const authorizationResponse = await authorizeTenant(
    state.authorizationToken.access_token,
    tenantId
  )

  console.connect(authorizationResponse)

  setAuthorizationToken(authorizationResponse)

  postToConnections({
    type: 'switch-tenant',
    payload: { token: state.authorizationToken, tenantId: tenantId }
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

    console.connect(expiration, timeout)
    authorizationTimeout = setTimeout(() => {
      refreshAuthorizationToken()
    }, timeout || 15000)
  } catch (e) {
    clearTimeout(authorizationTimeout)
    postToConnections({ type: 'error', payload: e })
  }
}

const handleLogin = async () => {
  postToChannelPorts({ payload: state.idToken })
}

const handleLogout = async () => {
  state.idToken = null
  state.authorizationToken = null
  postToConnections({ type: 'logout' })
}

let authorizing = false
const handleAuthorize = async idToken => {
  authorizing = true
  if (!state.authorizationToken) {
    const authorizationResponse = await authorize(idToken)
    console.connect(authorizationResponse)

    setAuthorizationToken(authorizationResponse)
  }

  console.connect(state.authorizationToken)
  postToChannelPorts({ payload: state.authorizationToken })
  authorizing = false
}

const connect = c => {
  const port = c.ports[0]
  ports.push(port)

  port.onmessage = e => {
    const type = e.data?.type
    const channelPort = e.ports[0]
    const payload = e.data?.payload

    if (type == 'login') {
      channelPorts.push(channelPort)
      handleLogin()
    }

    if (type == 'logout') {
      handleLogout()
    }

    if (type == 'authorize') {
      channelPorts.push(channelPort)
      if (!authorizing) {
        handleAuthorize(payload)
      }
    }

    if (type == 'switch-tenant') {
      channelPorts.push(channelPort)
      handleSwitchTenant(payload)
    }
  }

  port.start() // Required when using addEventListener. Otherwise called implicitly by onmessage setter.
}

self.onconnect = connect
