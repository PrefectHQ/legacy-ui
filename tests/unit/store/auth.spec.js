import {
  parseFromUrl,
  getTokens,
  getWithRedirect,
  getTokenByKey,
  isAuthenticated,
  isLoginRedirect,
  getUser,
  idToken,
  accessToken,
  signOut
} from '@okta/okta-auth-js'
jest.mock('@okta/okta-auth-js')

import auth from '@/store/auth'

// Mock the setauthUser method
// which is a root module we don't want to
// test here
auth.mutations['user/setOktaUser'] = jest.fn()

import {
  MOCK_AUTHORIZATION_TOKEN,
  MOCK_ID_TOKEN,
  MOCK_REFRESH_TOKEN,
  MOCK_PREFECT_AUTH_PAYLOAD
} from './mockTokens'

import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

import jwt_decode from 'jwt-decode'

jest.mock('logrocket', () => {
  return {
    identify: jest.fn()
  }
})

import LogRocket from 'logrocket'

jest.mock('@/middleware/prefectAuth', () => {
  return {
    prefectAuth: jest.fn(),
    prefectRefresh: jest.fn()
  }
})
import { prefectAuth, prefectRefresh } from '@/middleware/prefectAuth'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('auth Vuex Module', () => {
  const loggedInState = () => {
    return {
      authorizationToken: MOCK_AUTHORIZATION_TOKEN,
      authorizationTokenExpiry: new Date().getTime() + 10000,
      error: null,
      idToken: MOCK_ID_TOKEN,
      idTokenExpiry: jwt_decode(MOCK_ID_TOKEN).exp * 1000,
      isAuthenticated: true,
      isAuthorizingUser: false,
      isLoggingInUser: false,
      isRefreshingAuthentication: false,
      isRefreshingAuthorization: false,
      redirectRoute: null,
      refreshToken: MOCK_REFRESH_TOKEN,
      refreshTokenExpiry: jwt_decode(MOCK_REFRESH_TOKEN).exp * 1000,
      user: {
        sub: 'user',
        name: 'user',
        email: 'user@domain.com'
      }
    }
  }

  const loggedOutState = () => {
    return {
      authorizationToken: null,
      authorizationTokenExpiry: null,
      error: null,
      idToken: null,
      idTokenExpiry: null,
      isAuthenticated: false,
      isAuthorizingUser: false,
      isLoggingInUser: false,
      isRefreshingAuthentication: false,
      isRefreshingAuthorization: false,
      redirectRoute: null,
      refreshToken: null,
      refreshTokenExpiry: null,
      user: null
    }
  }

  describe('State', () => {
    it('should be initialized properly without tokens in localStorage ', () => {
      const state = auth.state

      expect(Object.keys(state).length).toBe(16)

      expect(state.user).toBe(null)
      expect(state.authorizationToken).toBe(null)
      expect(state.authorizationTokenExpiry).toBe(null)
      expect(state.idToken).toBe(null)
      expect(state.idTokenExpiry).toBe(null)
      expect(state.isAuthenticated).toBe(false)
      expect(state.isAuthorizingUser).toBe(false)
      expect(state.isLoggingInUser).toBe(false)
      expect(state.isRefreshingAuthentication).toBe(false)
      expect(state.isRefreshingAuthorization).toBe(false)
      expect(state.redirectRoute).toBe(null)
      expect(state.refreshToken).toBe(null)
      expect(state.refreshTokenExpiry).toBe(null)
    })

    it('should be checking against sessionStorage for the redirect route ', () => {
      expect(sessionStorage.getItem).toHaveBeenCalledWith('redirectRoute')
    })
  })

  describe('Getters', () => {
    let store

    beforeEach(() => {
      store = new Vuex.Store({
        state: loggedInState(),
        getters: auth.getters,
        actions: auth.actions,
        mutations: auth.mutations
      })
    })

    it('should return the user', () => {
      expect(store.getters.user).toBe(store.state.user)
    })

    it('should return the error property', () => {
      const errorState = loggedOutState()

      errorState.error = 'access_denied'

      store = new Vuex.Store({
        state: errorState,
        getters: auth.getters,
        actions: auth.actions,
        mutations: auth.mutations
      })

      expect(store.getters.error).toBe(store.state.error)
    })

    it('should return the idToken', () => {
      expect(store.getters.idToken).toBe(store.state.idToken)
    })

    it('should return isAuthenticated', () => {
      expect(store.getters.isAuthenticated).toBe(store.state.isAuthenticated)
    })

    it('should return isAuthorized', () => {
      expect(store.getters.isAuthorized).toBe(true)
    })

    it('should return the authorizationToken', () => {
      expect(store.getters.authorizationToken).toBe(
        store.state.authorizationToken
      )
    })

    it('should return the refreshToken', () => {
      expect(store.getters.refreshToken).toBe(store.state.refreshToken)
    })

    it('should return the authorizationTokenExpiry', () => {
      expect(store.getters.authorizationTokenExpiry).toBe(
        store.state.authorizationTokenExpiry
      )
    })

    it('should return the refreshTokenExpiry', () => {
      expect(store.getters.refreshTokenExpiry).toBe(
        store.state.refreshTokenExpiry
      )
    })

    it('should return the idTokenExpiry', () => {
      expect(store.getters.idTokenExpiry).toBe(store.state.idTokenExpiry)
    })

    it('should return isRefreshingAuthentication', () => {
      expect(store.getters.isRefreshingAuthentication).toBe(
        store.state.isRefreshingAuthentication
      )
    })

    it('should return isRefreshingAuthorization', () => {
      expect(store.getters.isRefreshingAuthorization).toBe(
        store.state.isRefreshingAuthorization
      )
    })

    it('should return isLoggingInUser', () => {
      expect(store.getters.isLoggingInUser).toBe(store.state.isLoggingInUser)
    })

    it('should return isAuthorizingUser', () => {
      expect(store.getters.isAuthorizingUser).toBe(
        store.state.isAuthorizingUser
      )
    })

    it('should return the redirectRoute', () => {
      expect(store.getters.redirectRoute).toBe(store.state.redirectRoute)
    })
  })

  describe('Mutations', () => {
    describe('...correctly set their associated states', () => {
      let store

      beforeEach(() => {
        store = new Vuex.Store({
          state: auth.state,
          getters: auth.getters,
          actions: auth.actions,
          mutations: auth.mutations
        })
      })

      it('should set the user', () => {
        store.commit('user', loggedInState().user)
        const user = loggedInState().user
        expect(store.getters['user'].name).toBe(user.name)
        expect(store.getters['user'].sub).toBe(user.sub)
        expect(store.getters['user'].email).toBe(user.email)
      })

      it('should set the idToken', () => {
        const idToken = loggedInState().idToken
        store.commit('idToken', idToken)
        expect(store.getters['idToken']).toBe(idToken)
      })

      it('should set the error property', () => {
        const error = 'access_denied'
        store.commit('error', error)
        expect(store.getters['error']).toBe(error)
      })

      it('should set isAuthenticated', () => {
        store.commit('isAuthenticated', true)
        expect(store.getters['isAuthenticated']).toBe(true)

        store.commit('isAuthenticated', false)
        expect(store.getters['isAuthenticated']).toBe(false)
      })

      it('should set the authorizationToken', () => {
        store.commit('authorizationToken', loggedInState().authorizationToken)
        expect(store.getters['authorizationToken']).toBe(
          loggedInState().authorizationToken
        )
      })

      it('should set the refreshToken', () => {
        store.commit('refreshToken', loggedInState().refreshToken)
        expect(store.getters['refreshToken']).toBe(loggedInState().refreshToken)
      })

      it('should set the authorizationTokenExpiry', () => {
        const loggedInStateExpiration = loggedInState().authorizationTokenExpiry
        store.commit('authorizationTokenExpiry', loggedInStateExpiration)
        expect(store.getters['authorizationTokenExpiry']).toBe(
          loggedInStateExpiration
        )
      })

      it('should set the refreshTokenExpiry', () => {
        const loggedInStateExpiration = loggedInState().refreshTokenExpiry
        store.commit('refreshTokenExpiry', loggedInStateExpiration)
        expect(store.getters['refreshTokenExpiry']).toBe(
          loggedInStateExpiration
        )
      })

      it('should set the idTokenExpiry', () => {
        const loggedInStateExpiration = loggedInState().idTokenExpiry
        store.commit('idTokenExpiry', loggedInStateExpiration)
        expect(store.getters['idTokenExpiry']).toBe(loggedInStateExpiration)
      })

      it('should set the isRefreshingAuthentication', () => {
        store.commit('isRefreshingAuthentication', true)
        expect(store.getters['isRefreshingAuthentication']).toBe(true)

        store.commit('isRefreshingAuthentication', false)
        expect(store.getters['isRefreshingAuthentication']).toBe(false)
      })

      it('should set the isRefreshingAuthorization', () => {
        store.commit('isRefreshingAuthorization', true)
        expect(store.getters['isRefreshingAuthorization']).toBe(true)

        store.commit('isRefreshingAuthorization', false)
        expect(store.getters['isRefreshingAuthorization']).toBe(false)
      })

      it('should set the isLoggingInUser', () => {
        store.commit('isLoggingInUser', true)
        expect(store.getters['isLoggingInUser']).toBe(true)

        store.commit('isLoggingInUser', false)
        expect(store.getters['isLoggingInUser']).toBe(false)
      })

      it('should set the isAuthorizingUser', () => {
        store.commit('isAuthorizingUser', true)
        expect(store.getters['isAuthorizingUser']).toBe(true)

        store.commit('isAuthorizingUser', false)
        expect(store.getters['isAuthorizingUser']).toBe(false)
      })

      it('should set the redirectRoute', () => {
        const route = '/prefect'
        expect(store.getters['redirectRoute']).toBe(null)

        store.commit('redirectRoute', route)
        expect(store.getters['redirectRoute']).toBe(route)

        expect(sessionStorage.getItem('redirectRoute')).toBe(route)
      })

      it('should unset the redirectRoute', () => {
        const route = '/prefect'
        store.state.redirectRoute = null
        expect(store.getters['redirectRoute']).toBe(null)

        store.commit('redirectRoute', route)
        expect(store.getters['redirectRoute']).toBe(route)
        expect(sessionStorage.getItem('redirectRoute')).toBe(route)

        store.commit('unsetRedirectRoute')
        expect(store.getters['redirectRoute']).toBe(null)
        expect(sessionStorage.removeItem).toHaveBeenCalledWith('redirectRoute')
        expect(sessionStorage.getItem('redirectRoute')).toBeFalsy()
      })
    })

    describe('... throw errors when invalid data are passed in', () => {
      let store

      beforeEach(() => {
        store = new Vuex.Store({
          state: auth.state,
          getters: auth.getters,
          actions: auth.actions,
          mutations: auth.mutations
        })

        localStorage.setItem.mockClear()
        localStorage.getItem.mockClear()
        localStorage.removeItem.mockClear()
      })

      it('user throws error on invalid state', () => {
        expect(() => store.commit('user', null)).toThrow(TypeError)
        expect(() => store.commit('user', false)).toThrow(TypeError)
        expect(() => store.commit('user', undefined)).toThrow(TypeError)
        expect(() => store.commit('user', 'test')).toThrow(TypeError)
        expect(() => store.commit('user', 12345)).toThrow(TypeError)
      })

      it('idToken throws error on invalid state', () => {
        expect(() => store.commit('idToken', null)).toThrow(TypeError)
        expect(() => store.commit('idToken', false)).toThrow(TypeError)

        expect(() => store.commit('idToken', undefined)).toThrow(TypeError)
        expect(() => store.commit('idToken', 'test')).toThrow(TypeError)
        expect(() => store.commit('idToken', 12345)).toThrow(TypeError)
      })

      it('isAuthenticated throws error on invalid state', () => {
        expect(() => store.commit('isAuthenticated', null)).toThrow(TypeError)
        expect(() => store.commit('isAuthenticated', undefined)).toThrow(
          TypeError
        )
        expect(() => store.commit('isAuthenticated', 'test')).toThrow(TypeError)
        expect(() => store.commit('isAuthenticated', 12345)).toThrow(TypeError)
      })
      it('authorizationToken throws error on invalid state', () => {
        expect(() => store.commit('authorizationToken', null)).toThrow(
          TypeError
        )
        expect(() => store.commit('authorizationToken', false)).toThrow(
          TypeError
        )
        expect(() => store.commit('authorizationToken', undefined)).toThrow(
          TypeError
        )
        expect(() => store.commit('authorizationToken', 'test')).toThrow(
          TypeError
        )
        expect(() => store.commit('authorizationToken', 12345)).toThrow(
          TypeError
        )
      })

      it('refreshToken throws error on invalid state', () => {
        expect(() => store.commit('refreshToken', null)).toThrow(TypeError)
        expect(() => store.commit('refreshToken', false)).toThrow(TypeError)
        expect(() => store.commit('refreshToken', undefined)).toThrow(TypeError)
        expect(() => store.commit('refreshToken', 'test')).toThrow(TypeError)
        expect(() => store.commit('refreshToken', 12345)).toThrow(TypeError)
      })

      it('authorizationTokenExpiry throws error on invalid state', () => {
        expect(() => store.commit('authorizationTokenExpiry', null)).toThrow(
          TypeError
        )
        expect(() => store.commit('authorizationTokenExpiry', false)).toThrow(
          TypeError
        )
        expect(() =>
          store.commit('authorizationTokenExpiry', undefined)
        ).toThrow(TypeError)
        expect(() => store.commit('authorizationTokenExpiry', 'test')).toThrow(
          TypeError
        )
      })

      it('refreshTokenExpiry throws error on invalid state', () => {
        expect(() => store.commit('refreshTokenExpiry', null)).toThrow(
          TypeError
        )
        expect(() => store.commit('refreshTokenExpiry', false)).toThrow(
          TypeError
        )
        expect(() => store.commit('refreshTokenExpiry', undefined)).toThrow(
          TypeError
        )
        expect(() => store.commit('refreshTokenExpiry', 'test')).toThrow(
          TypeError
        )
      })

      it('idTokenExpiry throws error on invalid state', () => {
        expect(() => store.commit('idTokenExpiry', null)).toThrow(TypeError)
        expect(() => store.commit('idTokenExpiry', false)).toThrow(TypeError)
        expect(() => store.commit('idTokenExpiry', undefined)).toThrow(
          TypeError
        )
        expect(() => store.commit('idTokenExpiry', 'test')).toThrow(TypeError)
      })

      it('isRefreshingAuthentication throws error on invalid state', () => {
        expect(() => store.commit('isRefreshingAuthentication', null)).toThrow(
          TypeError
        )
        expect(() =>
          store.commit('isRefreshingAuthentication', undefined)
        ).toThrow(TypeError)
        expect(() =>
          store.commit('isRefreshingAuthentication', 'test')
        ).toThrow(TypeError)
        expect(() => store.commit('isRefreshingAuthentication', 12345)).toThrow(
          TypeError
        )
      })

      it('isRefreshingAuthorization throws error on invalid state', () => {
        expect(() => store.commit('isRefreshingAuthorization', null)).toThrow(
          TypeError
        )
        expect(() =>
          store.commit('isRefreshingAuthorization', undefined)
        ).toThrow(TypeError)
        expect(() => store.commit('isRefreshingAuthorization', 'test')).toThrow(
          TypeError
        )
        expect(() => store.commit('isRefreshingAuthorization', 12345)).toThrow(
          TypeError
        )
      })

      it('isAuthorizingUser throws error on invalid state', () => {
        expect(() => store.commit('isAuthorizingUser', null)).toThrow(TypeError)
        expect(() => store.commit('isAuthorizingUser', undefined)).toThrow(
          TypeError
        )
        expect(() => store.commit('isAuthorizingUser', 'test')).toThrow(
          TypeError
        )
        expect(() => store.commit('isAuthorizingUser', 12345)).toThrow(
          TypeError
        )
      })

      it('isLoggingInUser throws error on invalid state', () => {
        expect(() => store.commit('isLoggingInUser', null)).toThrow(TypeError)
        expect(() => store.commit('isLoggingInUser', undefined)).toThrow(
          TypeError
        )
        expect(() => store.commit('isLoggingInUser', 'test')).toThrow(TypeError)
        expect(() => store.commit('isLoggingInUser', 12345)).toThrow(TypeError)
      })

      it('redirectRoute throws error on invalid state', () => {
        expect(() => store.commit('redirectRoute', null)).toThrow(TypeError)
        expect(() => store.commit('redirectRoute', false)).toThrow(TypeError)
        expect(() => store.commit('redirectRoute', undefined)).toThrow(
          TypeError
        )
        expect(() => store.commit('redirectRoute', 12345)).toThrow(TypeError)
      })
    })

    describe('... successfully resets stores with unset methods', () => {
      let store

      beforeEach(() => {
        store = new Vuex.Store({
          state: auth.state,
          getters: auth.getters,
          actions: auth.actions,
          mutations: auth.mutations
        })
      })

      it('unsets user', () => {
        store.commit('user', loggedInState().user)
        expect(store.getters['user']).toEqual(loggedInState().user)
        store.commit('unsetUser')
        expect(store.getters['user']).toBe(null)
      })

      it('unsets idToken', () => {
        const idToken = loggedInState().idToken
        store.commit('idToken', idToken)
        expect(store.getters['idToken']).toBe(idToken)

        store.commit('unsetIdToken')
        expect(store.getters['idToken']).toBe(null)
      })

      it('unsets refreshToken', () => {
        store.commit('refreshToken', loggedInState().refreshToken)
        expect(store.getters['refreshToken']).toBe(loggedInState().refreshToken)

        store.commit('unsetRefreshToken')
        expect(store.getters['refreshToken']).toBe(null)
      })

      it('unsets authorizationTokenExpiry', () => {
        const loggedInStateExpiration = loggedInState().authorizationTokenExpiry
        store.commit('authorizationTokenExpiry', loggedInStateExpiration)
        expect(store.getters['authorizationTokenExpiry']).toBe(
          loggedInStateExpiration
        )

        store.commit('unsetAuthorizationTokenExpiry')
        expect(store.getters['authorizationTokenExpiry']).toBe(null)
      })

      it('unsets refreshTokenExpiry', () => {
        const loggedInStateExpiration = loggedInState().refreshTokenExpiry
        store.commit('refreshTokenExpiry', loggedInStateExpiration)
        expect(store.getters['refreshTokenExpiry']).toBe(
          loggedInStateExpiration
        )

        store.commit('unsetRefreshTokenExpiry')
        expect(store.getters['refreshTokenExpiry']).toBe(null)
      })

      it('unsets idTokenExpiry', () => {
        const loggedInStateExpiration = loggedInState().idTokenExpiry
        store.commit('idTokenExpiry', loggedInStateExpiration)
        expect(store.getters['idTokenExpiry']).toBe(loggedInStateExpiration)

        store.commit('unsetIdTokenExpiry')
        expect(store.getters['idTokenExpiry']).toBe(null)
      })

      it('unsets redirectRoute', () => {
        const route = '/prefect'
        store.commit('redirectRoute', route)
        expect(store.getters.redirectRoute).toBe(route)

        store.commit('unsetRedirectRoute')
        expect(store.getters['redirectRoute']).toBe(null)
      })
    })
  })

  describe('Actions', () => {
    let store

    beforeEach(() => {
      store = new Vuex.Store({
        state: auth.state,
        getters: auth.getters,
        actions: auth.actions,
        mutations: auth.mutations
      })

      isAuthenticated.mockClear()
      isLoginRedirect.mockClear()
      parseFromUrl.mockClear()
      getTokens.mockClear()
      getUser.mockClear()
    })

    describe('authenticate', () => {
      beforeEach(() => {
        store = new Vuex.Store({
          state: auth.state,
          getters: auth.getters,
          actions: auth.actions,
          mutations: auth.mutations
        })

        isAuthenticated.mockClear()
        isLoginRedirect.mockClear()
        parseFromUrl.mockClear()
        getTokens.mockClear()
        getUser.mockClear()
      })

      it('calls the isAuthenticated method', async () => {
        await store.dispatch('authenticate')
        expect(isAuthenticated).toHaveBeenCalled()
      })

      it('calls the isLoginRedirect method', async () => {
        await store.dispatch('authenticate')
        expect(isLoginRedirect).toHaveBeenCalled()
      })

      it('correctly returns the value of isAuthenticated', async () => {
        isAuthenticated.mockReturnValueOnce(false)
        getTokens.mockReturnValueOnce(false)
        let authenticateResult = await store.dispatch('authenticate')
        expect(authenticateResult).toBe(false)

        isLoginRedirect.mockReturnValueOnce(true)
        parseFromUrl.mockClear()
        authenticateResult = await store.dispatch('authenticate')
        expect(store.getters.isAuthenticated).toBe(true)
        expect(authenticateResult).toBe(true)
      })

      it('tries to pull tokens from the token manager if is not a login redirect', async () => {
        isLoginRedirect.mockReturnValueOnce(false)
        await store.dispatch('authenticate')
        expect(parseFromUrl).not.toHaveBeenCalled()
        expect(getTokens).toHaveBeenCalled()
      })

      it('tries to pull tokens from the url if isLoginRedirect is true', async () => {
        isLoginRedirect.mockReturnValueOnce(true)
        await store.dispatch('authenticate')
        expect(getTokens).not.toHaveBeenCalled()
        expect(parseFromUrl).toHaveBeenCalled()
      })

      it('sets the redirect route when one is present in the URL and not in the store', async () => {
        isAuthenticated.mockReturnValueOnce(false)
        await store.dispatch('removeRedirectRoute')

        const redirectRoute = '/path/to/some/place'

        delete window.location
        window.location = { pathname: redirectRoute, search: '' }

        expect(store.getters['redirectRoute']).toBe(null)
        await store.dispatch('authenticate')
        expect(store.getters['redirectRoute']).toBe(redirectRoute)
      })

      it('does not set the redirect route when one is present in the store', async () => {
        isAuthenticated.mockReturnValueOnce(false)

        const redirectRoute = '/path/to/some/place',
          otherRedirectRoute = '/path/to/some/other/place',
          searchParams = '?some_query=123'
        await store.dispatch('setRedirectRoute', redirectRoute)
        expect(store.getters['redirectRoute']).toBe(redirectRoute)

        delete window.location
        window.location = {
          pathname: otherRedirectRoute,
          search: searchParams
        }

        await store.dispatch('authenticate')
        expect(store.getters['redirectRoute']).not.toBe(
          otherRedirectRoute + searchParams
        )
      })
    })

    describe('authorize', () => {
      describe('user', () => {
        beforeEach(() => {
          getTokenByKey.mockReturnValueOnce(MOCK_ID_TOKEN)

          prefectAuth.mockReturnValueOnce(MOCK_PREFECT_AUTH_PAYLOAD)
          LogRocket.identify.mockReset()
        })

        it('is retrieved from the authClient', async () => {
          await store.dispatch('authorize')
          expect(getUser).toHaveBeenCalled()
        })

        it('is stored', async () => {
          const user = loggedInState().user
          getUser.mockReturnValueOnce(user)
          await store.dispatch('authorize')
          expect(store.getters['user']).toBe(user)
        })

        it('is reported to logrocket if exists', async () => {
          getUser.mockReturnValueOnce(loggedInState().user)
          await store.dispatch('authorize')
          expect(LogRocket.identify).toHaveBeenCalled()
        })
      })

      describe('prefectAuthorization', () => {
        beforeEach(() => {
          prefectAuth.mockReturnValueOnce(MOCK_PREFECT_AUTH_PAYLOAD)
          LogRocket.identify.mockReset()
        })

        it('is retrieved from the prefectAuth method by passing in the stored idToken', async () => {
          store.commit('idToken', MOCK_ID_TOKEN)
          await store.dispatch('authorize')
          expect(prefectAuth).toHaveBeenCalledWith(MOCK_ID_TOKEN)
        })

        it('is stored', async () => {
          await store.dispatch('authorize')

          expect(store.getters['authorizationToken']).toBe(
            MOCK_PREFECT_AUTH_PAYLOAD.access_token
          )
          expect(store.getters['refreshToken']).toBe(
            MOCK_PREFECT_AUTH_PAYLOAD.refresh_token
          )
          expect(store.getters['authorizationTokenExpiry']).toBe(
            new Date(MOCK_PREFECT_AUTH_PAYLOAD.expires_at).getTime()
          )
          expect(store.getters['refreshTokenExpiry']).toBe(
            jwt_decode(MOCK_PREFECT_AUTH_PAYLOAD.refresh_token).exp * 1000
          )
        })
      })
    })

    describe('refreshAuthorization', () => {
      describe('prefectAuthorization', () => {
        beforeEach(() => {
          store.commit('refreshToken', MOCK_REFRESH_TOKEN)
          store.commit('authorizationToken', MOCK_AUTHORIZATION_TOKEN)
          prefectRefresh.mockReturnValueOnce(MOCK_PREFECT_AUTH_PAYLOAD)
          LogRocket.identify.mockReset()
        })

        it('is retrieved from the prefectAuth method by passing in the stored authorizationToken', async () => {
          await store.dispatch('refreshAuthorization')

          expect(prefectRefresh).toHaveBeenCalledWith(MOCK_AUTHORIZATION_TOKEN)
        })

        it('is stored', async () => {
          await store.dispatch('refreshAuthorization')

          expect(store.getters['authorizationToken']).toBe(
            MOCK_PREFECT_AUTH_PAYLOAD.access_token
          )
          expect(store.getters['refreshToken']).toBe(
            MOCK_PREFECT_AUTH_PAYLOAD.refresh_token
          )
          expect(store.getters['authorizationTokenExpiry']).toBe(
            new Date(MOCK_PREFECT_AUTH_PAYLOAD.expires_at).getTime()
          )
          expect(store.getters['refreshTokenExpiry']).toBe(
            jwt_decode(MOCK_PREFECT_AUTH_PAYLOAD.refresh_token).exp * 1000
          )
        })
      })
    })

    describe('updateAuthentication', () => {
      beforeEach(() => {
        store = new Vuex.Store({
          state: auth.state,
          getters: auth.getters,
          actions: auth.actions,
          mutations: auth.mutations
        })

        isAuthenticated.mockReturnValue(false)

        const user = loggedInState().user
        getUser.mockReturnValue(user)

        getTokenByKey.mockReset()
      })

      it('gets idToken and accessTokens from the token manager', async () => {
        await store.dispatch('updateAuthentication')
        expect(getTokenByKey).toHaveBeenCalledTimes(2)
      })

      it('calls getWithRedirect when not authenticated', async () => {
        await store.dispatch('updateAuthentication')
        expect(getWithRedirect).toHaveBeenCalled()
      })

      it('commits new idToken', async () => {
        store.commit('idToken', MOCK_ID_TOKEN)
        expect(store.getters['idToken']).toBe(MOCK_ID_TOKEN)

        getTokenByKey.mockReset()
        getTokenByKey
          .mockReturnValueOnce(idToken)
          .mockReturnValueOnce(accessToken)

        await store.dispatch('updateAuthentication')

        expect(getTokenByKey).toHaveBeenCalledTimes(2)
        expect(store.getters['idToken']).toBe(idToken.value)
      })
    })

    describe('updateAuthorization', () => {
      it('commits the authorization data', async () => {
        store.dispatch('updateAuthorization', MOCK_PREFECT_AUTH_PAYLOAD)

        expect(store.getters['authorizationToken']).toBe(
          MOCK_PREFECT_AUTH_PAYLOAD.access_token
        )
        expect(store.getters['refreshToken']).toBe(
          MOCK_PREFECT_AUTH_PAYLOAD.refresh_token
        )
        expect(store.getters['authorizationTokenExpiry']).toBe(
          new Date(MOCK_PREFECT_AUTH_PAYLOAD.expires_at).getTime()
        )
        expect(store.getters['refreshTokenExpiry']).toBe(
          jwt_decode(MOCK_PREFECT_AUTH_PAYLOAD.refresh_token).exp * 1000
        )
      })
    })

    describe('login', () => {
      it('calls the loginWithRedirect method', async () => {
        await store.dispatch('login')
        jest.runAllTimers()
        expect(getWithRedirect).toHaveBeenCalled()
      })
    })

    describe('logout', () => {
      it('removes the redirect route from sessionStorage', async () => {
        const redirectRoute = '/before/logging/out/redirect'
        await store.dispatch('setRedirectRoute', redirectRoute)

        expect(sessionStorage.getItem('redirectRoute')).toBe(redirectRoute)

        await store.dispatch('logout')
        expect(sessionStorage.getItem('redirectRoute')).toBeFalsy()
      })

      it('calls the logout method', async () => {
        await store.dispatch('logout')
        expect(signOut).toHaveBeenCalledWith()
      })
    })

    describe('setRedirectRoute', () => {
      it('sets the redirectRoute', () => {
        const somePath = '/some/path'
        store.dispatch('setRedirectRoute', somePath)
        expect(store.getters['redirectRoute']).toBe(somePath)
      })
    })

    describe('removeRedirectRoute', () => {
      it('removes the redirectRoute', () => {
        const somePath = '/some/path'
        store.dispatch('setRedirectRoute', somePath)
        expect(store.getters['redirectRoute']).toBe(somePath)

        store.dispatch('removeRedirectRoute')
        expect(store.getters['redirectRoute']).toBe(null)
      })
    })

    describe('reportUserToLogRocket', () => {
      beforeEach(() => {
        store = new Vuex.Store({
          state: loggedOutState(),
          getters: auth.getters,
          actions: auth.actions,
          mutations: auth.mutations
        })

        LogRocket.identify.mockReset()
      })

      it('calls the LogRocket identify method if a user is set', () => {
        const user = loggedInState().user
        store.commit('user', user)

        store.dispatch('reportUserToLogRocket')

        expect(LogRocket.identify).toHaveBeenCalled()
      })

      it('does not call the LogRocket identify method if a user is not set', () => {
        store.commit('unsetUser')
        expect(store.getters['user']).toBe(null)
        store.dispatch('reportUserToLogRocket')
        expect(LogRocket.identify).not.toHaveBeenCalled()
      })
    })

    describe('authentication flow with query params', () => {
      let store

      beforeEach(() => {
        store = new Vuex.Store({
          state: auth.state,
          getters: auth.getters,
          actions: auth.actions,
          mutations: auth.mutations
        })

        delete window.location

        isAuthenticated.mockReturnValue(false)
      })

      describe('a user comes from an email invite link', () => {
        it('stores the invitation id in local storage', async () => {
          window.location = { search: '?invitation_id=xyz' }

          await store.dispatch('authenticate')
          expect(sessionStorage.getItem('invitationId')).toBe('xyz')
        })
      })

      describe('the url contains a partner source', () => {
        it('stores the partner source in session storage', async () => {
          window.location = { search: '?partner_source=prefect' }

          await store.dispatch('authenticate')
          expect(sessionStorage.getItem('partnerSource')).toBe('prefect')
        })
      })

      describe('the url contains an authentication error', () => {
        it('stores the error and aborts the authentication flow', async () => {
          window.location = { search: '?error=access_denied' }

          await store.dispatch('authenticate')
          expect(store.getters['error']).toBe('access_denied')
        })
      })
    })
  })
})
