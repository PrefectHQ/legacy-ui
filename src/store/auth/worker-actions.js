import jwt_decode from 'jwt-decode'
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
  }
})

const actions = {
  async authenticate({ dispatch, commit, getters }) {
    // authClient.authStateManager.unsubscribe(dispatch('authenticate'))

    const urlParams = new URLSearchParams(window?.location?.search)
    const invitationId = urlParams.get('invitation_id')
    const source = urlParams.get('partner_source')
    const error = urlParams.get('error')
    // const errorDescription = urlParams.get('error_description') // We don't need to capture this at the moment
    if (window.location?.pathname && !getters['redirectRoute']) {
      dispatch(
        'setRedirectRoute',
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
      commit('error', error)
      return
    }

    try {
      const isAuthenticated = await authClient.isAuthenticated()
      const isLoginRedirect = await authClient.isLoginRedirect()

      const { tokens } = isLoginRedirect
        ? await authClient.token.parseFromUrl()
        : {
            tokens: await authClient.tokenManager.getTokens()
          }

      // authClient.authStateManager.subscribe(dispatch('authenticate'))

      if (tokens?.accessToken && tokens?.idToken) {
        // dispatch('commitTokens', tokens)
        TokenWorker.port.postMessage({
          type: 'authentication',
          payload: tokens
        })
        commit('isAuthenticated', true)
      } else if (isAuthenticated) {
        await dispatch('updateAuthentication')
      } else {
        commit('isAuthenticated', false)
        await dispatch('login')
      }
    } catch (e) {
      // eslint-disable-next-line
      console.error(e)
      commit('error', e)
    }

    return getters['isAuthenticated']
  },
  async updateAuthenticationTokens({ commit }, payload) {
    const idToken = payload.idToken
    const accessToken = payload.accessToken

    authClient.tokenManager.setTokens(payload)

    commit('accessToken', accessToken.value)
    commit('accessTokenExpiry', accessToken.expiresAt)

    commit('idToken', idToken.value)
    commit('idTokenExpiry', idToken.expiresAt)
  },
  async updateAuthorizationTokens({ commit }, payload) {
    commit('authorizationToken', payload.access_token)
    commit('refreshToken', payload.refresh_token)
    commit('authorizationTokenExpiry', new Date(payload.expires_at).getTime())
    commit('refreshTokenExpiry', jwt_decode(payload.refresh_token).exp * 1000)
  }
}

export default {
  actions
}
