import { promiseChannel } from '@/workers/util/worker-interface.js'
import { authenticate, authClient } from '@/auth/authentication.js'
import {
  authorize,
  authorizeTenant,
  refreshTokens,
  revokeTokens
} from '@/auth/authorization.js'

import store from '@/store'
import LogRocket from 'logrocket'

import jwt_decode from 'jwt-decode'

let TokenWorker
if (typeof window.SharedWorker !== 'undefined') {
  // // Initializes the shared service worker that handles token refresh
  TokenWorker = new SharedWorker('@/workers/auth.worker.js', {
    type: 'module'
  })
} else {
  // eslint-disable-next-line no-console
  console.log(
    "Shared service worker couldn't be registered, falling back to legacy auth pattern."
  )
  // workers aren't supported; we'll fall back to the legacy auth pattern
}

if (TokenWorker?.port) {
  TokenWorker.port.onmessage = async e => {
    const type = e.data?.type
    const payload = e.data?.payload

    // console.log(type, payload)

    switch (type) {
      case 'idToken':
        commitTokens({ idToken: payload })
        break
      case 'authorizationToken':
        commitTokens({ authorizationTokens: payload })
        break
      case 'clear':
        authClient.tokenManager.clear()
        unsetTokens()
        authClient.signOut()
        break
      case 'logout':
        authClient.signOut()
        unsetTokens()
        break
      case 'switch-tenant':
        if (
          store.getters['tenant/tenant']?.id !== payload.tenantId &&
          !store.getters['tenant/isLoadingTenant'] &&
          !window.location.pathname?.includes('team-switched')
        ) {
          window.location.href = '/team-switched'
        } else {
          if (process.env.VUE_APP_BACKEND === 'CLOUD') {
            store.dispatch('license/getLicense')
          }
        }
        break
      case 'accessDenied':
        await authClient.signOut({
          clientId: process.env.VUE_APP_PUBLIC_CLIENT_ID,
          idToken: payload,
          postLogoutRedirectUri:
            window.location.origin + '/access-denied?reason=invalid_sso'
        })
        break
      case 'console':
        // This should only be used for debugging
        // eslint-disable-next-line no-console
        // console.log('TokenWorker console', payload)
        LogRocket.track('TokenWorker console', payload)
        break
      case 'error':
        // eslint-disable-next-line no-console
        console.log('TokenWorker error', payload)
        LogRocket.captureException(payload)
        break
      default:
        // This should only be used for debugging
        // eslint-disable-next-line no-console
        // console.log('default', payload)
        LogRocket.track('TokenWorker Message', payload)
        break
    }
  }

  TokenWorker.onerror = e => {
    // eslint-disable-next-line no-console
    console.log('Error message received from Token Worker', e)
    LogRocket.captureException(e)
  }

  TokenWorker.port.start()
}

export { TokenWorker }

export const commitTokens = tokens => {
  if (!tokens) return

  if (tokens.idToken) {
    const idToken = tokens.idToken

    store.commit('auth/idToken', idToken.idToken)
    store.commit('auth/idTokenExpiry', idToken.expiresAt * 1000)
    store.commit('auth/user', idToken.claims)
    store.commit('user/setOktaUser', idToken.claims)
  }

  if (tokens.authorizationTokens) {
    const authToken = tokens.authorizationTokens.access_token
    const expiry = new Date(tokens.authorizationTokens.expires_at).getTime()
    const refreshToken = tokens.authorizationTokens.refresh_token

    store.commit('auth/authorizationToken', authToken)
    store.commit('auth/refreshToken', refreshToken)

    store.commit('auth/authorizationTokenExpiry', expiry)
    store.commit('auth/refreshTokenExpiry', jwt_decode(refreshToken).exp * 1000)
  }
}

export const unsetTokens = () => {
  store.commit('auth/unsetIdToken')
  store.commit('auth/unsetIdTokenExpiry')
  store.commit('auth/unsetUser')
  store.commit('auth/unsetAuthorizationToken')
  store.commit('auth/unsetAuthorizationTokenExpiry')
  store.commit('auth/unsetRefreshToken')
  store.commit('auth/unsetRefreshTokenExpiry')
}

let refreshTimeout
const refresh = tokens => {
  clearTimeout(refreshTimeout)
  const expiration = new Date(tokens.expires_at)
  const timeout = ((expiration - Date.now()) * 3) / 4
  refreshTimeout = setTimeout(async () => {
    const refreshedTokens = await refreshTokens(
      tokens.access_token,
      tokens.refresh_token
    )
    commitTokens({ authorizationTokens: refreshedTokens })
    refresh(refreshedTokens)
  }, timeout || 15000)
}

authClient.tokenManager.on('renewed', (key, idToken) => {
  if (key === 'idToken' && idToken) {
    commitTokens({ idToken: idToken })

    if (TokenWorker) {
      TokenWorker.port.postMessage({
        type: 'idToken',
        payload: idToken
      })
    }
  }
})

export const login = async (fallback = false) => {
  // try getting a token from the service worker
  // if we have a service worker, ping that for a token
  // otherwise we go through the okta login process directly
  let idToken, authorizationTokens, source
  try {
    if (TokenWorker && !fallback) {
      idToken = await promiseChannel(TokenWorker, 'login')
      source = 'TokenWorker'

      if (!idToken || idToken.expiresAt * 1000 < Date.now()) {
        const loginResponse = await authenticate()

        idToken = loginResponse?.idToken
        source = 'AuthClient <> TokenWorker'

        TokenWorker.port.postMessage({
          type: 'idToken',
          payload: idToken
        })
      }

      if (idToken && (idToken.idToken || idToken.value)) {
        authorizationTokens = await promiseChannel(
          TokenWorker,
          'authorize',
          idToken.idToken || idToken.value
        )
      }
    } else {
      const loginResponse = await authenticate()

      source = 'AuthClient <> InMemory'
      idToken = loginResponse?.idToken

      if (idToken && (idToken.idToken || idToken.value)) {
        authorizationTokens = await authorize(idToken.idToken || idToken.value)
        refresh(authorizationTokens)
      }
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Login error', e)
    LogRocket.captureException(e)
  }

  if (idToken && authorizationTokens) {
    return {
      idToken: idToken,
      authorizationTokens: authorizationTokens,
      source: source
    }
  } else {
    // If this session fails to get idTokens, we call the clear method
    // to post messages to all other sessions that they need to sign out
    // This also clears all stored tokens for these sessions
    if (TokenWorker) {
      TokenWorker.port.postMessage({
        type: 'clear'
      })
    }
  }
}

export const switchTenant = async tenantId => {
  let authorizationTokens

  if (TokenWorker) {
    authorizationTokens = await promiseChannel(
      TokenWorker,
      'switch-tenant',
      tenantId
    )
  } else {
    authorizationTokens = await authorizeTenant(
      store.getters['auth/authorizationToken'],
      tenantId
    )
  }

  return {
    authorizationTokens: authorizationTokens
  }
}

export const logout = async () => {
  await revokeTokens(
    store.getters['auth/authorizationToken'],
    store.getters['auth/refreshToken']
  )

  if (TokenWorker) {
    TokenWorker.port.postMessage({
      type: 'logout'
    })
  } else {
    try {
      await authClient.signOut()
      unsetTokens()
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e)
      LogRocket.captureException(e)
    }
  }
}
