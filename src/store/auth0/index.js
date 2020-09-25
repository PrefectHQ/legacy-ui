import createAuth0Client from '@auth0/auth0-spa-js'
import LogRocket from 'logrocket'
import { prefectAuth, prefectRefresh } from '@/middleware/prefectAuth'
import jwt_decode from 'jwt-decode'

let auth0Client

const state = {
  authorizationToken: null,
  authorizationTokenExpiry: null,
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
  async initAuth0() {
    auth0Client = await createAuth0Client({
      domain: process.env.VUE_APP_AUTH0_DOMAIN,
      client_id: process.env.VUE_APP_AUTH0_PUBLIC_CLIENT_ID,
      redirect_uri: process.env.VUE_APP_BASE_URL || window.location.origin,
      scope: 'openid email'
    })
  },
  async authenticate({ dispatch, commit, getters }) {
    if (!auth0Client) await dispatch('initAuth0')

    if (window.location.search.includes('code=')) {
      await auth0Client.handleRedirectCallback()
    }

    const isAuthenticated = await auth0Client.isAuthenticated()
    commit('isAuthenticated', isAuthenticated)

    if (window.location.pathname && !getters['redirectRoute']) {
      dispatch('setRedirectRoute', window.location.pathname)
    }

    if (window.location.search.includes('invitation_id=')) {
      const invitationID = window.location.search.split('=')
      localStorage.setItem('invitationId', invitationID[1])
    }

    if (!isAuthenticated) {
      try {
        await auth0Client.getTokenSilently()
      } catch {
        await dispatch('login')
      }
    }

    return await auth0Client.isAuthenticated()
  },
  async authorize({ commit, getters, dispatch }) {
    if (!auth0Client) await dispatch('initAuth0')

    commit('isAuthorizingUser', true)

    const user = await auth0Client.getUser()
    if (!user) return

    commit('user', user)
    dispatch('reportUserToLogRocket')

    const idTokenClaims = await auth0Client.getIdTokenClaims()
    if (!idTokenClaims) return

    commit('idToken', idTokenClaims.__raw)
    commit('idTokenExpiry', jwt_decode(idTokenClaims.__raw).exp * 1000)
    commit('user/setAuth0User', idTokenClaims, {
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
  async refreshAuthorization({ getters, commit, dispatch }) {
    if (!auth0Client) await dispatch('initAuth0')

    await dispatch('updateAuthentication')

    commit('isRefreshingAuthorization', true)
    const prefectAuthorization = await prefectRefresh(
      getters['authorizationToken']
    )
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
  async updateAuthentication({ dispatch, commit, getters }) {
    if (!auth0Client) await dispatch('initAuth0')

    const bypassAuthentication = await auth0Client.isAuthenticated()
    if (bypassAuthentication) return

    commit('isRefreshingAuthentication', true)

    // This should manually update authentication
    await auth0Client.getTokenSilently()

    const user = await auth0Client.getUser()
    commit('user', user)
    dispatch('reportUserToLogRocket')

    const idTokenClaims = await auth0Client.getIdTokenClaims()
    commit('idToken', idTokenClaims.__raw)
    commit('idTokenExpiry', jwt_decode(idTokenClaims.__raw).exp * 1000)
    commit('user/setAuth0User', idTokenClaims, {
      root: true
    })

    const isAuthenticated = await auth0Client.isAuthenticated()
    commit('isAuthenticated', isAuthenticated)

    if (!getters['isAuthenticated']) {
      await dispatch('login')
    }

    commit('isRefreshingAuthentication', false)
  },
  async login({ commit }) {
    commit('isLoggingInUser', true)
    // NO IDEA WHY THIS TIMEOUT IS NECESSARY
    // the redirect "fails" (succeeds but login doesn't show, despite the DOM all being present)
    // about 50% of the time without this timeout.
    setTimeout(() => {
      auth0Client.loginWithRedirect()
      commit('isLoggingInUser', false)
    }, 2000)
  },
  async logout({ commit }) {
    commit('unsetRedirectRoute')
    auth0Client.logout({})
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
