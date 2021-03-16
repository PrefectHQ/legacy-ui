import LogRocket from 'logrocket'
import { prefectAuth, prefectRefresh } from '@/middleware/prefectAuth'
import jwt_decode from 'jwt-decode'

import { OktaAuth } from '@okta/okta-auth-js'

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
        dispatch('commitTokens', tokens)
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
  async authorize({ commit, getters, dispatch }) {
    if (!getters['isAuthenticated']) return

    commit('isAuthorizingUser', true)

    const user = await authClient.getUser()
    if (!user) return

    commit('user', user)
    dispatch('reportUserToLogRocket')

    commit('user/setOktaUser', user, {
      root: true
    })

    const prefectAuthorization = await prefectAuth(getters['idToken'])
    if (prefectAuthorization) {
      // Update authorization credentials if user is authorized
      await dispatch('updateAuthorization', prefectAuthorization)
    } else {
      // Unset authorization if user is not authorized
      commit('unsetAuthorizationToken')
      commit('unsetAuthorizationTokenExpiry')
      commit('unsetRefreshToken')
      commit('unsetRefreshTokenExpiry')
    }

    commit('isAuthorizingUser', false)
    return getters['authorizationToken']
  },
  async commitTokens({ commit }, tokens) {
    const idToken = tokens.idToken
    const accessToken = tokens.accessToken

    authClient.tokenManager.setTokens(tokens)

    commit('accessToken', accessToken.value)
    commit('accessTokenExpiry', accessToken.expiresAt)

    commit('idToken', idToken.value)
    commit('idTokenExpiry', idToken.expiresAt)
  },
  async refreshAuthorization(state) {
    console.log('calling refresh', state)

    if (state.getters['isRefreshingAuthorization']) return

    await state.dispatch('updateAuthentication')

    state.commit('isRefreshingAuthorization', true)

    const prefectAuthorization = await prefectRefresh(
      state.getters['authorizationToken']
    )

    state.dispatch('updateAuthorization', prefectAuthorization)
    state.commit('isRefreshingAuthorization', false)
  },
  async updateAuthorization({ commit }, authorization) {
    commit('authorizationToken', authorization.access_token)
    commit('refreshToken', authorization.refresh_token)
    commit(
      'authorizationTokenExpiry',
      new Date(authorization.expires_at).getTime()
    )
    commit(
      'refreshTokenExpiry',
      jwt_decode(authorization.refresh_token).exp * 1000
    )
  },
  async updateAuthentication({ dispatch, commit, getters }) {
    if (getters['isRefreshingAuthentication']) return

    commit('isRefreshingAuthentication', true)

    try {
      // This should manually update authentication
      const idToken = await authClient.tokenManager.get('idToken')
      const accessToken = await authClient.tokenManager.get('accessToken')

      if (!idToken || !accessToken) {
        commit('isAuthenticated', false)
        await dispatch('login')
      } else {
        commit('isAuthenticated', true)
        dispatch('commitTokens', {
          idToken: idToken,
          accessToken: accessToken
        })
      }
    } catch (e) {
      // eslint-disable-next-line
      console.error(e)
      commit('error', e)
    }

    commit('isRefreshingAuthentication', false)
  },
  async login({ commit }) {
    commit('isLoggingInUser', true)
    authClient.token.getWithRedirect({
      responseType: ['token', 'id_token']
    })
    commit('isLoggingInUser', false)
  },
  async logout({ commit }) {
    commit('isAuthenticated', false)
    commit('unsetIdToken')
    commit('unsetAccessToken')
    commit('unsetRedirectRoute')
    await authClient.signOut()
  },
  setRedirectRoute({ commit }, redirectRoute) {
    commit('redirectRoute', redirectRoute)
  },
  removeRedirectRoute({ commit }) {
    commit('unsetRedirectRoute')
  },
  reportUserToLogRocket({ state }) {
    if (!state.user) return

    LogRocket.identify(state.user.sub, {
      name: state.user.name || '',
      email: state.user.email || ''
    })
  }
}

export default {
  actions
}
