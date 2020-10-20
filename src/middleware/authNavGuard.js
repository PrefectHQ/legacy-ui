import store from '@/store/index'

const isAuthenticated = () => {
  return store.getters['auth0/isAuthenticated']
}

const isAuthorized = () => {
  return store.getters['auth0/isAuthorized']
}

const isServer = () => {
  return store.getters['api/isServer']
}

const authNavGuard = async (to, from, next) => {
  // If this is a Server deployment,
  // we bypass authentication
  if (isServer()) return next()
  if (isAuthenticated() && isAuthorized() && store.getters['user/userIsSet']) {
    return next()
  }

  if (!isAuthenticated()) {
    await store.dispatch('auth0/authenticate')
  }

  if (!isAuthorized()) {
    await store.dispatch('auth0/authorize')
  }

  // If the user isn't authenticated or authorized
  // at this point, we abort navigation
  if (!isAuthenticated() || !isAuthorized()) {
    return next(false)
  }

  // If we're not connected, dispatch the getApi method, which will update connection status
  // and will start to monitor the connection
  if (!store.getters['api/isConnected']) store.dispatch('api/getApi')

  if (!store.getters['user/userIsSet']) await store.dispatch('user/getUser')

  const redirectRoute = store.getters['auth0/redirectRoute']
  if (redirectRoute) {
    store.dispatch('auth0/removeRedirectRoute')
    if (to.query && to.query.code) delete to.query.code
    if (to.query && to.query.state) delete to.query.state

    return next({ path: redirectRoute, params: to.params, query: to.query })
  }

  return next()
}

export default authNavGuard
