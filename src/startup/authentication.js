import { OktaAuth } from '@okta/okta-auth-js'
import { TokenWorker } from '@/main'
import store from '@/store'

const {
  VUE_APP_PUBLIC_CLIENT_ID,
  VUE_APP_PUBLIC_ISSUER,
  VUE_APP_ENVIRONMENT
} = process.env

const authClient = new OktaAuth({
  clientId: VUE_APP_PUBLIC_CLIENT_ID,
  issuer: VUE_APP_PUBLIC_ISSUER,
  redirectUri: window.location.origin,
  postLogoutRedirectUri: window.location.origin + '/logout',
  scopes: ['openid', 'profile', 'email'],
  testing: {
    disableHttpsCheck: VUE_APP_ENVIRONMENT !== 'production'
  },
  tokenManager: {
    autoRenew: true
  }
})

const login = async () => {
  store.commit('isLoggingInUser', true)
  authClient.token.getWithRedirect({
    responseType: ['token', 'id_token']
  })
  store.commit('isLoggingInUser', false)
}

// Authenticates the user with Prefect Okta
export const authenticate = async () => {
  authClient.authStateManager.unsubscribe()
  authClient.tokenManager.off('renewed')

  const urlParams = new URLSearchParams(window?.location?.search)
  const invitationId = urlParams.get('invitation_id')
  const source = urlParams.get('partner_source')
  const error = urlParams.get('error')
  // const errorDescription = urlParams.get('error_description') // We don't need to capture this at the moment
  if (window.location?.pathname && !store.getters['redirectRoute']) {
    store.commit(
      'redirectRoute',
      window.location.pathname + window.location.search
    )
  }

  if (invitationId) {
    sessionStorage.setItem('invitationId', invitationId)
  }

  if (source) {
    sessionStorage.setItem('partnerSource', source)
  }

  if (error) {
    store.commit('error', error)
    return
  }

  try {
    //   I don't really understand what this is doing
    authClient.authStateManager.subscribe(({ idToken, accessToken }) => {
      console.log('auth client SUBSCRIPTION event', idToken, accessToken)
      //   dispatch('updateAuthenticationTokens', { idToken, accessToken })
    })

    const isLoginRedirect = await authClient.isLoginRedirect()

    const { tokens } = isLoginRedirect
      ? await authClient.token.parseFromUrl()
      : {
          tokens: await authClient.tokenManager.getTokens()
        }

    if (tokens?.accessToken && tokens?.idToken) {
      TokenWorker.port.postMessage({
        type: 'authentication',
        payload: tokens
      })
      //   await store.dispatch('updateAuthenticationTokens', tokens)

      // Subscribe to renew events
      //   I don't really understand what this event is doing
      authClient.tokenManager.on('renewed', () => {
        console.log('auth client RENEWED event')
        //     authenticate()
      })
    } else {
      await login()
    }
  } catch (e) {
    // eslint-disable-next-line
    console.error(e)
    store.commit('error', e)
  }
}

export const logout = async (postMessage = false) => {
  if (await authClient.isAuthenticated()) {
    await authClient.signOut()
  }

  if (postMessage) {
    TokenWorker.port.postMessage({
      type: 'logout'
    })
  }

  store.commit('unsetIdToken')
  store.commit('unsetAccessToken')
  store.commit('unsetRedirectRoute')
}
