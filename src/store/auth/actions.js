import jwt_decode from 'jwt-decode'
import LogRocket from 'logrocket'
import { OktaAuth } from '@okta/okta-auth-js'
import { TokenWorker } from '@/main'

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

const authorize = () =>
  new Promise((res, rej) => {
    const channel = new MessageChannel()

    channel.port1.onmessage = data => {
      channel.port1.close()
      if (data.type == 'error') {
        rej(data)
      } else {
        res(data.data.payload)
      }
    }

    TokenWorker.port.postMessage({ type: 'authorization' }, [channel.port2])
  })

const actions = {
  async authenticate({ dispatch, commit, getters }) {
    authClient.authStateManager.unsubscribe()
    authClient.tokenManager.off('renewed')

    const urlParams = new URLSearchParams(window?.location?.search)
    const invitationId = urlParams.get('invitation_id')
    const source = urlParams.get('partner_source')
    const error = urlParams.get('error')
    // const errorDescription = urlParams.get('error_description') // We don't need to capture this at the moment
    if (window.location?.pathname && !getters['redirectRoute']) {
      commit('redirectRoute', window.location.pathname + window.location.search)
    }

    if (invitationId) {
      sessionStorage.setItem('invitationId', invitationId)
    }

    if (source) {
      sessionStorage.setItem('partnerSource', source)
    }

    if (error) {
      commit('error', error)
      return
    }

    try {
      authClient.authStateManager.subscribe(({ idToken, accessToken }) => {
        dispatch('updateAuthenticationTokens', { idToken, accessToken })
      })

      const isLoginRedirect = await authClient.isLoginRedirect()

      const { tokens } = isLoginRedirect
        ? await authClient.token.parseFromUrl()
        : {
            tokens: await authClient.tokenManager.getTokens()
          }

      const expiration = tokens?.idToken.expiresAt * 1000

      if (
        tokens?.accessToken &&
        tokens?.idToken &&
        new Date().getTime() < expiration
      ) {
        TokenWorker.port.postMessage({
          type: 'authentication',
          payload: tokens
        })
        await dispatch('updateAuthenticationTokens', tokens)

        // Subscribe to renew events
        authClient.tokenManager.on('renewed', () => {
          dispatch('authenticate')
        })
      } else {
        await dispatch('login')
      }
    } catch (e) {
      // eslint-disable-next-line
      console.error(e)
      LogRocket.captureException(e)
      commit('error', e)
    }

    return getters['isAuthenticated']
  },
  async authorize({ commit, getters, dispatch }) {
    try {
      if (!getters['isAuthenticated']) return

      commit('isAuthorizingUser', true)

      const user = await authClient.getUser()
      if (!user) return

      commit('user', user)
      dispatch('reportUserToLogRocket')

      commit('user/setOktaUser', user, {
        root: true
      })
      const tokens = await authorize()

      if (tokens) {
        // Update authorization credentials if user is authorized
        await dispatch('updateAuthorizationTokens', tokens)
      } else {
        // Unset authorization if user is not authorized
        commit('unsetAuthorizationToken')
        commit('unsetAuthorizationTokenExpiry')
        commit('unsetRefreshToken')
        commit('unsetRefreshTokenExpiry')
      }

      commit('isAuthorizingUser', false)
      return getters['authorizationToken']
    } catch (e) {
      LogRocket.captureException(e)
    }
  },
  async updateAuthenticationTokens({ commit }, payload) {
    if (!payload.idToken || !payload.accessToken) return

    const idToken = payload.idToken
    const accessToken = payload.accessToken

    authClient.tokenManager.setTokens(payload)

    commit('accessToken', accessToken.value)
    commit('accessTokenExpiry', accessToken.expiresAt * 1000) // Okta returns token expiration in seconds
    commit('idToken', idToken.value)
    commit('idTokenExpiry', idToken.expiresAt * 1000) // Okta returns token expiration in seconds
  },
  async updateAuthorizationTokens({ commit }, payload) {
    if (!payload.access_token || !payload.refresh_token) return

    commit('authorizationToken', payload.access_token)
    commit('refreshToken', payload.refresh_token)
    commit('authorizationTokenExpiry', new Date(payload.expires_at).getTime())
    commit('refreshTokenExpiry', jwt_decode(payload.refresh_token).exp * 1000)
  },
  async login({ commit }) {
    commit('isLoggingInUser', true)
    authClient.token.getWithRedirect({
      responseType: ['token', 'id_token']
    })
    commit('isLoggingInUser', false)
  },
  async logout({ commit, getters }, postMessage = false) {
    if (getters['isAuthenticated']) {
      await authClient.signOut()
    }

    if (postMessage) {
      TokenWorker.port.postMessage({
        type: 'logout'
      })
    }

    commit('unsetIdToken')
    commit('unsetAccessToken')
    commit('unsetRedirectRoute')
  },
  reportUserToLogRocket({ getters }) {
    if (!getters['user']) return

    LogRocket.identify(getters['user'].sub, {
      name: getters['user'].name || '',
      email: getters['user'].email || ''
    })
  }
}

export default {
  actions
}
