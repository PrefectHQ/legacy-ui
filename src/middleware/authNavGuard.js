import store from '@/store/index'

const isAuthenticated = () => {
  return store.getters['auth/isAuthenticated']
}

const isAuthorized = () => {
  return store.getters['auth/isAuthorized']
}

const isServer = () => {
  return store.getters['api/isServer']
}

const authNavGuard = async (to, from, next) => {
  // If this is a Server deployment,
  // we bypass authentication
  if (isServer()) return next()
  // if (isAuthenticated() && isAuthorized() && store.getters['user/userIsSet']) {
  //   return next()
  // }

  if (!isAuthenticated()) {
    await store.dispatch('auth/authenticate')
  }

  if (!isAuthorized()) {
    await store.dispatch('auth/authorize')
  }

  // If the user isn't authenticated or authorized
  // at this point, we abort navigation
  if (!isAuthenticated() || !isAuthorized()) {
    return next(false)
  }

  // If we're not connected, dispatch the getApi method, which will update connection status
  // and will start to monitor the connection
  if (!store.getters['api/connected']) store.dispatch('api/getApi')

  if (!store.getters['user/userIsSet']) store.dispatch('user/getUser')

  const redirectRoute = store.getters['auth/redirectRoute']
  if (redirectRoute) {
    store.dispatch('auth/removeRedirectRoute')
    if (to.query && to.query.code) delete to.query.code
    if (to.query && to.query.state) delete to.query.state

    return next({ path: redirectRoute, params: to.params, query: to.query })
  }

  return next()
}

export default authNavGuard
