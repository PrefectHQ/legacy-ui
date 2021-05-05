import jwt_decode from 'jwt-decode'

const state = {
  authorizationToken: null,
  authorizationTokenExpiry: null,
  accessToken: null,
  accessTokenExpiry: null,
  error: null,
  idToken: null,
  idTokenExpiry: null,
  isAuthorizingUser: false,
  isLoggingInUser: false,
  isRefreshingAuthentication: false,
  isRefreshingAuthorization: false,
  legacy: false,
  redirectRoute: sessionStorage.getItem('redirectRoute'),
  refreshToken: null,
  refreshTokenExpiry: null,
  user: null
}

const getters = {
  isAuthenticated(state) {
    return !!state.idToken && new Date().getTime() < state.idTokenExpiry
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
  legacy(state) {
    return state.legacy
  },
  accessToken(state) {
    return state.accessToken
  },
  accessTokenExpiry(state) {
    return state.accessTokenExpiry
  },
  error(state) {
    return state.error
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
  error(state, error) {
    state.error = error
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

    sessionStorage.setItem('redirectRoute', redirectRoute)
    state.redirectRoute = redirectRoute
  },
  unsetRedirectRoute(state) {
    state.redirectRoute = null
    sessionStorage.removeItem('redirectRoute')
  }
}

const actions = {}

export default {
  state,
  getters,
  mutations,
  actions,
  namespaced: true
}
