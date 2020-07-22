import store from '@/store/index'

const isAuthenticated = () => {
  return store.getters['auth0/isAuthenticated']
}

const isAuthorized = () => {
  return store.getters['auth0/isAuthorized']
}

const getApi = async () => {
  if (!store.getters['api/backend']) {
    await store.dispatch('api/getApi', 'authnavguard')
  }
  return store.getters['api/backend']
}

const isServer = () => {
  return store.getters['api/isServer']
}

const authNavGuard = async (to, from, next) => {
  await getApi()
  console.log('after get api')

  // If this is a Server deployment,
  // we don't need to worry about Authentication
  if (isServer()) return next()

  // if (!isServer()) {
  // In this scenario we're unable to connect to the user-defined
  // endpoint, so we redirect to the connection page
  // return next({
  //   name: 'start'
  // })
  //   return next()
  // }

  if (isAuthenticated() && isAuthorized() && store.getters['user/userIsSet']) {
    return next()
  }

  console.log(
    isAuthenticated(),
    isAuthorized(),
    store.getters['user/userIsSet'],
    'break 1'
  )

  if (!isAuthenticated()) {
    await store.dispatch('auth0/authenticate')
  }

  if (isAuthenticated() && !isAuthorized()) {
    await store.dispatch('auth0/authorize')
    if (!isAuthorized()) {
      return next({ path: 'thanks' })
    }
  }

  console.log('break 2')

  // If the user isn't authenticated or authorized
  // at this point, we abort navigation
  if (!isAuthenticated() || !isAuthorized()) {
    return next(false)
  }

  console.log('break 3')
  if (!store.getters['user/userIsSet']) await store.dispatch('user/getUser')

  const redirectRoute = store.getters['auth0/redirectRoute']
  if (redirectRoute) {
    store.dispatch('auth0/removeRedirectRoute')
    if (to.query && to.query.code) delete to.query.code
    if (to.query && to.query.state) delete to.query.state
    return next({ path: redirectRoute, params: to.params, query: to.query })
  }

  console.log('getting everything')

  return next()
}

export default authNavGuard
