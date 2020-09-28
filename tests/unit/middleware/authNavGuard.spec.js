import sinon from 'sinon'
import store from '@/store'
import authNavGuard from '@/middleware/authNavGuard'
import { MOCK_AUTHORIZATION_TOKEN } from '../store/mockTokens'

describe('Auth Nav Guard', () => {
  let dispatchStub
  beforeEach(() => {
    store.commit('user/unsetUser')
    store.commit('auth0/isAuthenticated', false)
    store.commit('auth0/unsetAuthorizationToken')
    store.commit('auth0/unsetAuthorizationTokenExpiry')
    store.commit('api/unsetBackend')
    dispatchStub = sinon.stub(store, ['dispatch'])
    dispatchStub.callThrough()
  })

  afterEach(() => {
    store.dispatch.restore()
    store.commit('user/unsetUser')
    store.commit('auth0/isAuthenticated', false)
    store.commit('auth0/unsetAuthorizationToken')
    store.commit('auth0/unsetAuthorizationTokenExpiry')
    store.commit('api/unsetBackend')
  })

  describe('...when the backend is server', () => {
    it('bypasses auth', async () => {
      store.commit('api/setBackend', 'SERVER')
      expect(store.getters['api/isServer']).toBe(true)
      const next = jest.fn()
      await authNavGuard({}, {}, next)
      expect(next).toHaveBeenCalledWith()
    })
  })

  describe('...when the user is neither authenticated authorized', () => {
    it('calls the authentication route', async () => {
      dispatchStub.withArgs('auth0/authorize').callsFake()
      dispatchStub.withArgs('auth0/authenticate').callsFake(async () => {
        store.commit('auth0/isAuthenticated', true)
      })

      expect(store.getters['auth0/isAuthorized']).toBe(false)
      expect(store.getters['auth0/isAuthenticated']).toBe(false)

      const next = jest.fn()

      await authNavGuard({}, {}, next)

      expect(store.getters['auth0/isAuthenticated']).toBe(true)
    })

    it('calls the authorization route after authenticating', async () => {
      dispatchStub.withArgs('user/getUser').callsFake(async () => {
        store.commit('user/user', { name: 'test_user' })
      })

      dispatchStub.withArgs('auth0/authorize').callsFake(async () => {
        store.commit('auth0/authorizationToken', MOCK_AUTHORIZATION_TOKEN)
        store.commit(
          'auth0/authorizationTokenExpiry',
          new Date().getTime() + 100000000
        )
      })

      dispatchStub.withArgs('auth0/authenticate').callsFake(async () => {
        store.commit('auth0/isAuthenticated', true)
      })

      expect(store.getters['auth0/isAuthorized']).toBe(false)
      expect(store.getters['auth0/isAuthenticated']).toBe(false)

      const next = jest.fn()

      await authNavGuard({}, {}, next)

      expect(store.getters['auth0/isAuthenticated']).toBe(true)
      expect(store.getters['auth0/isAuthorized']).toBe(true)
      expect(next).toHaveBeenCalledWith()
    })
  })

  it('calls next when the user is authorized, authenticated, and set', () => {
    store.commit('user/user', { name: 'test_user' })
    store.commit('auth0/isAuthenticated', true)
    store.commit('auth0/authorizationToken', MOCK_AUTHORIZATION_TOKEN)
    store.commit(
      'auth0/authorizationTokenExpiry',
      new Date().getTime() + 100000000
    )

    const next = jest.fn()

    authNavGuard({}, {}, next)

    expect(next).toHaveBeenCalledWith()
  })

  it('calls the authorization route when the user is authenticated but not authorized', async () => {
    store.commit('auth0/isAuthenticated', true)

    dispatchStub.withArgs('user/getUser').callsFake(async () => {
      store.commit('user/user', { name: 'test_user' })
    })

    dispatchStub.withArgs('auth0/authorize').callsFake(async () => {
      store.commit('auth0/authorizationToken', MOCK_AUTHORIZATION_TOKEN)
      store.commit(
        'auth0/authorizationTokenExpiry',
        new Date().getTime() + 100000000
      )
    })

    const next = jest.fn()

    expect(store.getters['auth0/isAuthorized']).toBe(false)

    await authNavGuard({}, {}, next)

    expect(store.getters['auth0/isAuthorized']).toBe(true)

    expect(next).toHaveBeenCalledWith()
  })

  it('calls the getUser route when the user is authenticated and authorized, but no user is set', async () => {
    store.commit('auth0/isAuthenticated', true)
    store.commit('auth0/authorizationToken', MOCK_AUTHORIZATION_TOKEN)
    store.commit(
      'auth0/authorizationTokenExpiry',
      new Date().getTime() + 100000000
    )
    dispatchStub.withArgs('user/getUser').callsFake(async () => {
      store.commit('user/user', { name: 'test_user' })
    })

    const next = jest.fn()
    expect(store.getters['user/userIsSet']).toBe(false)

    await authNavGuard({}, {}, next)

    expect(store.getters['user/userIsSet']).toBe(true)

    // We test here that next was called *with no arguments*
    // explicitly, since that has a big impact on what the method does
    // in the navguard
    expect(next).toHaveBeenCalledWith()
  })

  it('aborts navigation when the user cannot be authorized or authenticated', async () => {
    dispatchStub.withArgs('auth0/authorize').resolves()

    dispatchStub.withArgs('auth0/authenticate').resolves()

    const next = jest.fn()

    await authNavGuard({}, {}, next)

    expect(next).toHaveBeenCalledWith(false)
  })

  it('calls next with a redirect route, if one is present in the store', async () => {
    let redirectRoute = '/some/path'

    store.commit('auth0/isAuthenticated', true)
    store.commit('auth0/authorizationToken', MOCK_AUTHORIZATION_TOKEN)
    store.commit(
      'auth0/authorizationTokenExpiry',
      new Date().getTime() + 100000000
    )

    dispatchStub.withArgs('user/getUser').callsFake(async () => {
      store.commit('user/user', { name: 'test_user' })
    })

    store.commit('auth0/redirectRoute', redirectRoute)

    expect(store.getters['auth0/redirectRoute']).toBe(redirectRoute)

    const next = jest.fn()

    await authNavGuard({}, {}, next)

    expect(next).toHaveBeenCalledWith({ path: redirectRoute })
  })

  it('calls next with false if authorization fails', async () => {
    store.commit('auth0/isAuthenticated', true)
    dispatchStub.withArgs('auth0/authorize').resolves()
    const next = jest.fn()
    expect(store.getters['auth0/isAuthorized']).toBe(false)
    expect(store.getters['auth0/isAuthenticated']).toBe(true)
    await authNavGuard({}, {}, next)
    expect(store.getters['auth0/isAuthorized']).toBe(false)
    expect(store.getters['auth0/isAuthenticated']).toBe(true)
    expect(next).toHaveBeenCalledWith(false)
  })
})
