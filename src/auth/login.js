import { promiseChannel } from '@/workers/util/worker-interface.js'
import { authenticate } from '@/auth/authentication.js'
import { authorize, authorizeTenant } from '@/auth/authorization.js'

import store from '@/store'

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
  TokenWorker.port.onmessage = e => {
    const type = e.data?.type
    const payload = e.data?.payload

    // console.log(type, payload)

    switch (type) {
      case 'idToken':
        store.commit('auth/idToken', payload)
        break
      default:
        break
    }
  }

  // TODO: Implement error handling from the token worker
  TokenWorker.port.onmessageerror = e => {
    // eslint-disable-next-line no-console
    console.log('Error message received from Token Worker', e)
    // LogRocket.captureException(e)
  }

  TokenWorker.port.start()
}

export { TokenWorker }

export const login = async () => {
  // try getting a token from the service worker
  // if we have a service worker, ping that for a token
  // otherwise we go through the okta login process directly
  let idToken, authorizationTokens

  if (TokenWorker) {
    idToken = await promiseChannel(TokenWorker, 'login')

    if (!idToken) {
      const loginResponse = await authenticate()

      TokenWorker.port.postMessage({
        type: 'idToken',
        payload: idToken
      })

      idToken = loginResponse?.idToken

      if (!idToken) return
    }

    authorizationTokens = await promiseChannel(
      TokenWorker,
      'authorize',
      idToken.value
    )
  } else {
    const loginResponse = await authenticate()

    idToken = loginResponse.idToken

    authorizationTokens = await authorize(idToken.value)
  }

  return {
    idToken: idToken,
    authorizationTokens: authorizationTokens
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
