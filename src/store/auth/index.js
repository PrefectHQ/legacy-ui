import LogRocket from 'logrocket'
import { prefectAuth, prefectRefresh } from '@/middleware/prefectAuth'
import jwt_decode from 'jwt-decode'

import { OktaAuth } from '@okta/okta-auth-js'

const { VUE_APP_PUBLIC_CLIENT_ID, VUE_APP_PUBLIC_ISSUER } = process.env

const authClient = new OktaAuth({
  clientId: VUE_APP_PUBLIC_CLIENT_ID,
  issuer: VUE_APP_PUBLIC_ISSUER,
  redirectUri: window.location.origin,
  postLogoutRedirectUri: window.location.origin + '/logout',
  scopes: ['openid', 'profile', 'email'],
  testing: {
    disableHttpsCheck: true
  }
})

const state = {
  authorizationToken: null,
  authorizationTokenExpiry: null,
  accessToken: null,
  accessTokenExpiry: null,
  idToken: null,
  idTokenExpiry: null,
  isAuthenticated: false,
  isAuthorizingUser: false,
  isLoggingInUser: false,
  isRefreshingAuthentication: false,
  isRefreshingAuthorization: false,
  redirectRoute: localStorage.getItem('redirectRoute') || null,
  refreshToken: null,
  refreshTokenExpiry: null,
  user: null
}

const getters = {
  isAuthenticated(state) {
    return !!state.isAuthenticated
  },
  isAuthorized(state) {
    return (
      !!state.authorizationToken &&
      new Date().getTime() < state.authorizationTokenExpiry
    )
  },
  user(state) {
    return state.user
  },
  accessToken(state) {
    return state.accessToken
  },
  accessTokenExpiry(state) {
    return state.accessTokenExpiry
  },
  idToken(state) {
    return state.idToken
  },
  idTokenExpiry(state) {
    return state.idTokenExpiry
  },
  refreshToken(state) {
    return state.refreshToken
  },
  refreshTokenExpiry(state) {
    return state.refreshTokenExpiry
  },
  authorizationToken(state) {
    return state.authorizationToken
  },
  authorizationTokenExpiry(state) {
    return state.authorizationTokenExpiry
  },
  isRefreshingAuthentication(state) {
    return state.isRefreshingAuthentication
  },
  isRefreshingAuthorization(state) {
    return state.isRefreshingAuthorization
  },
  isAuthorizingUser(state) {
    return state.isAuthorizingUser
  },
  isLoggingInUser(state) {
    return state.isLoggingInUser
  },
  redirectRoute(state) {
    return state.redirectRoute
  }
}

const mutations = {
  isAuthenticated(state, isAuthenticated) {
    if (typeof isAuthenticated !== 'boolean' || isAuthenticated == null)
      throw new TypeError(
        `isAuthenticated must be a boolean, got ${typeof isAuthenticated} instead`
      )

    state.isAuthenticated = isAuthenticated
  },
  user(state, user) {
    if (typeof user !== 'object' || user == null)
      throw new TypeError(`user must be an object, got ${typeof user} instead`)

    state.user = user
  },
  unsetUser(state) {
    state.user = null
  },
  accessToken(state, accessToken) {
    try {
      jwt_decode(accessToken)
    } catch (e) {
      throw new TypeError(
        `accessToken must be a valid JWT, got a malformed one instead. ${e}`
      )
    }

    state.accessToken = accessToken
  },
  unsetAccessToken(state) {
    state.accessToken = null
  },
  accessTokenExpiry(state, accessTokenExpiry) {
    if (typeof accessTokenExpiry !== 'number' || accessTokenExpiry == null)
      throw new TypeError(
        `accessTokenExpiry must be an number, got ${typeof accessTokenExpiry} instead`
      )

    state.accessTokenExpiry = accessTokenExpiry
  },
  unsetAccessTokenExpiry(state) {
    state.idTokenExpiry = null
  },
  idToken(state, idToken) {
    try {
      jwt_decode(idToken)
    } catch (e) {
      throw new TypeError(
        `idToken must be a valid JWT, got a malformed one instead. ${e}`
      )
    }

    state.idToken = idToken
  },
  unsetIdToken(state) {
    state.idToken = null
  },
  idTokenExpiry(state, idTokenExpiry) {
    if (typeof idTokenExpiry !== 'number' || idTokenExpiry == null)
      throw new TypeError(
        `idTokenExpiry must be an number, got ${typeof idTokenExpiry} instead`
      )

    state.idTokenExpiry = idTokenExpiry
  },
  unsetIdTokenExpiry(state) {
    state.idTokenExpiry = null
  },
  authorizationToken(state, authorizationToken) {
    try {
      jwt_decode(authorizationToken)
    } catch (e) {
      throw new TypeError(
        `authorizationToken must be a valid JWT, got a malformed one instead. ${e}`
      )
    }
    state.authorizationToken = authorizationToken
  },
  unsetAuthorizationToken(state) {
    state.authorizationToken = null
  },
  refreshToken(state, refreshToken) {
    try {
      jwt_decode(refreshToken)
    } catch (e) {
      throw new TypeError(
        `refreshToken must be a valid JWT, got a malformed one instead. ${e}`
      )
    }
    state.refreshToken = refreshToken
  },
  unsetRefreshToken(state) {
    state.refreshToken = null
  },
  authorizationTokenExpiry(state, authorizationTokenExpiry) {
    if (
      typeof authorizationTokenExpiry !== 'number' ||
      authorizationTokenExpiry == null
    )
      throw new TypeError(
        `authorizationTokenExpiry must be an number, got ${typeof authorizationTokenExpiry} instead`
      )

    state.authorizationTokenExpiry = authorizationTokenExpiry
  },
  unsetAuthorizationTokenExpiry(state) {
    state.authorizationTokenExpiry = null
  },
  refreshTokenExpiry(state, refreshTokenExpiry) {
    if (typeof refreshTokenExpiry !== 'number' || refreshTokenExpiry == null)
      throw new TypeError(
        `refreshTokenExpiry must be an number, got ${typeof refreshTokenExpiry} instead`
      )

    state.refreshTokenExpiry = refreshTokenExpiry
  },
  unsetRefreshTokenExpiry(state) {
    state.refreshTokenExpiry = null
  },
  isRefreshingAuthentication(state, refreshing) {
    if (typeof refreshing !== 'boolean' || refreshing == null)
      throw new TypeError(
        `isRefreshingAuthentication must be a boolean, got ${typeof refreshing} instead`
      )

    state.isRefreshingAuthentication = refreshing
  },
  isRefreshingAuthorization(state, refreshing) {
    if (typeof refreshing !== 'boolean' || refreshing == null)
      throw new TypeError(
        `isRefreshingAuthorization must be a boolean, got ${typeof refreshing} instead`
      )

    state.isRefreshingAuthorization = refreshing
  },
  isAuthorizingUser(state, authorizingUser) {
    if (typeof authorizingUser !== 'boolean' || authorizingUser == null)
      throw new TypeError(
        `isAuthorizingUser must be a boolean, got ${typeof authorizingUser} instead`
      )

    state.isAuthorizingUser = authorizingUser
  },
  isLoggingInUser(state, loggingInUser) {
    if (typeof loggingInUser !== 'boolean' || loggingInUser == null)
      throw new TypeError(
        `isLoggingInUser must be a boolean, got ${typeof loggingInUser} instead`
      )

    state.isLoggingInUser = loggingInUser
  },
  redirectRoute(state, redirectRoute) {
    if (typeof redirectRoute !== 'string' || redirectRoute == null)
      throw new TypeError(
        `redirectRoute must be a string, got ${typeof redirectRoute} instead`
      )

    localStorage.setItem('redirectRoute', redirectRoute)
    state.redirectRoute = redirectRoute
  },
  unsetRedirectRoute(state) {
    state.redirectRoute = null
    localStorage.removeItem('redirectRoute')
  }
}

const actions = {
  async authenticate({ dispatch, commit }) {
    if (window.location?.pathname && !getters['redirectRoute']) {
      dispatch('setRedirectRoute', window.location.pathname)
    }

    if (window.location?.search?.includes('invitation_id=')) {
      const invitationID = window.location.search.split('=')
      sessionStorage.setItem('invitationId', invitationID[1])
    }

    const isLoginRedirect = authClient.token.isLoginRedirect()
    const { tokens } = isLoginRedirect
      ? await authClient.token.parseFromUrl()
      : await authClient.tokenManager.getTokens()

    // eslint-disable-next-line
    console.log(tokens)

    if (!tokens) {
      commit('isAuthenticated', false)
      await dispatch('login')
    } else {
      dispatch('commitTokens', tokens)

      commit('isAuthenticated', true)
    }
  },
  async authorize({ commit, getters, dispatch }) {
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
  async refreshAuthorization({ getters, commit, dispatch }) {
    await dispatch('updateAuthentication')

    commit('isRefreshingAuthorization', true)
    const prefectAuthorization = await prefectRefresh(getters['refreshToken'])
    dispatch('updateAuthorization', prefectAuthorization)
    commit('isRefreshingAuthorization', false)
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
  async updateAuthentication({ dispatch, commit }) {
    const bypassAuthentication = await authClient.isAuthenticated()
    if (bypassAuthentication) return

    commit('isRefreshingAuthentication', true)

    // This should manually update authentication
    const idToken = await authClient.tokenManager.get('idToken')
    const accessToken = await authClient.tokenManager.get('accessToken')

    // eslint-disable-next-line
    console.log(idToken, accessToken)
    if (!idToken || !accessToken) {
      commit('isAuthenticated', false)
      await dispatch('login')
    } else {
      dispatch('commitTokens', {
        idToken: idToken,
        accessToken: accessToken
      })
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
  state,
  getters,
  mutations,
  actions,
  namespaced: true
}
