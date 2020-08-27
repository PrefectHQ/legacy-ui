import {
  handleRedirectCallback,
  isAuthenticated,
  getUser,
  getIdTokenClaims,
  getTokenSilently,
  loginWithRedirect,
  logout
} from '@auth0/auth0-spa-js'
jest.mock('@auth0/auth0-spa-js')

import auth0 from '@/store/auth0'

// Mock the setAuth0User method
// which is a root module we don't want to
// test here
auth0.mutations['user/setAuth0User'] = jest.fn()

import {
  MOCK_AUTHORIZATION_TOKEN,
  MOCK_ID_TOKEN,
  MOCK_ID_TOKEN_2,
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

describe('Auth0 Vuex Module', () => {
  const loggedInState = () => {
    return {
      authorizationToken: MOCK_AUTHORIZATION_TOKEN,
      authorizationTokenExpiry: new Date().getTime() + 10000,
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
      const state = auth0.state

      expect(Object.keys(state).length).toBe(13)

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

    it('should be checking against localstorage for the redirect route ', () => {
      expect(localStorage.getItem).toHaveBeenCalledWith('redirectRoute')
    })
  })

  describe('Getters', () => {
    describe('... while in a valid logged in state', () => {
      let store

      beforeEach(() => {
        store = new Vuex.Store({
          state: loggedInState(),
          getters: auth0.getters,
          actions: auth0.actions,
          mutations: auth0.mutations
        })
      })

      it('should return the user', () => {
        expect(store.getters.user).toBe(store.state.user)
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

    describe('... while in a logged out state', () => {
      let store

      beforeEach(() => {
        store = new Vuex.Store({
          state: loggedOutState(),
          getters: auth0.getters,
          actions: auth0.actions,
          mutations: auth0.mutations
        })
      })

      it('should return the user', () => {
        expect(store.getters.user).toBe(store.state.user)
      })

      it('should return the idToken', () => {
        expect(store.getters.idToken).toBe(store.state.idToken)
      })

      it('should return isAuthenticated', () => {
        expect(store.getters.isAuthenticated).toBe(store.state.isAuthenticated)
      })

      it('should return isAuthorized', () => {
        expect(store.getters.isAuthorized).toBe(false)
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
  })

  describe('Mutations', () => {
    describe('... correctly set their associated states', () => {
      let store

      beforeEach(() => {
        store = new Vuex.Store({
          state: auth0.state,
          getters: auth0.getters,
          actions: auth0.actions,
          mutations: auth0.mutations
        })
      })

      it('should set the user', () => {
        store.commit('user', loggedInState().user)
        expect(store.getters['user'].name).toBe(loggedInState().user.name)
        expect(store.getters['user'].sub).toBe(loggedInState().user.sub)
        expect(store.getters['user'].email).toBe(loggedInState().user.email)

        store.commit('unsetUser')
        expect(store.getters['user']).toBe(loggedOutState().user)
      })

      it('should set the idToken', () => {
        let idToken = loggedInState().idToken
        store.commit('idToken', idToken)
        expect(store.getters['idToken']).toBe(idToken)
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
        let loggedInStateExpiration = loggedInState().authorizationTokenExpiry
        store.commit('authorizationTokenExpiry', loggedInStateExpiration)
        expect(store.getters['authorizationTokenExpiry']).toBe(
          loggedInStateExpiration
        )
      })

      it('should set the refreshTokenExpiry', () => {
        let loggedInStateExpiration = loggedInState().refreshTokenExpiry
        store.commit('refreshTokenExpiry', loggedInStateExpiration)
        expect(store.getters['refreshTokenExpiry']).toBe(
          loggedInStateExpiration
        )
      })

      it('should set the idTokenExpiry', () => {
        let loggedInStateExpiration = loggedInState().idTokenExpiry
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
        let route = '/prefect'
        expect(store.getters['redirectRoute']).toBe(null)

        store.commit('redirectRoute', route)
        expect(store.getters['redirectRoute']).toBe(route)

        expect(localStorage.getItem('redirectRoute')).toBe(route)
      })

      it('should unset the redirectRoute', () => {
        let route = '/prefect'
        store.state.redirectRoute = null
        expect(store.getters['redirectRoute']).toBe(null)

        store.commit('redirectRoute', route)
        expect(store.getters['redirectRoute']).toBe(route)
        expect(localStorage.getItem('redirectRoute')).toBe(route)

        store.commit('unsetRedirectRoute')
        expect(store.getters['redirectRoute']).toBe(null)
        expect(localStorage.removeItem).toHaveBeenCalledWith('redirectRoute')
        expect(localStorage.getItem('redirectRoute')).toBeFalsy()
      })
    })

    describe('... throw errors when invalid data are passed in', () => {
      let store

      beforeEach(() => {
        store = new Vuex.Store({
          state: auth0.state,
          getters: auth0.getters,
          actions: auth0.actions,
          mutations: auth0.mutations
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
          state: auth0.state,
          getters: auth0.getters,
          actions: auth0.actions,
          mutations: auth0.mutations
        })
      })

      it('unsets user', () => {
        store.commit('user', loggedInState().user)
        expect(store.getters['user'].name).toBe(loggedInState().user.name)
        expect(store.getters['user'].sub).toBe(loggedInState().user.sub)
        expect(store.getters['user'].email).toBe(loggedInState().user.email)

        store.commit('unsetUser')
        expect(store.getters['user']).toBe(null)
      })

      it('unsets idToken', () => {
        let idToken = loggedInState().idToken
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
        let loggedInStateExpiration = loggedInState().authorizationTokenExpiry
        store.commit('authorizationTokenExpiry', loggedInStateExpiration)
        expect(store.getters['authorizationTokenExpiry']).toBe(
          loggedInStateExpiration
        )

        store.commit('unsetAuthorizationTokenExpiry')
        expect(store.getters['authorizationTokenExpiry']).toBe(null)
      })

      it('unsets refreshTokenExpiry', () => {
        let loggedInStateExpiration = loggedInState().refreshTokenExpiry
        store.commit('refreshTokenExpiry', loggedInStateExpiration)
        expect(store.getters['refreshTokenExpiry']).toBe(
          loggedInStateExpiration
        )

        store.commit('unsetRefreshTokenExpiry')
        expect(store.getters['refreshTokenExpiry']).toBe(null)
      })

      it('unsets idTokenExpiry', () => {
        let loggedInStateExpiration = loggedInState().idTokenExpiry
        store.commit('idTokenExpiry', loggedInStateExpiration)
        expect(store.getters['idTokenExpiry']).toBe(loggedInStateExpiration)

        store.commit('unsetIdTokenExpiry')
        expect(store.getters['idTokenExpiry']).toBe(null)
      })

      it('unsets redirectRoute', () => {
        let route = '/prefect'
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
        state: auth0.state,
        getters: auth0.getters,
        actions: auth0.actions,
        mutations: auth0.mutations
      })

      handleRedirectCallback.mockClear()
      isAuthenticated.mockClear()
      loginWithRedirect.mockClear()
      getUser.mockClear()
      getIdTokenClaims.mockClear()
    })

    // Having a hard time testing this constructor
    // ... the class is definitely mocked
    // but unclear how to spy on its implementation while still
    // returning functions correctly
    // describe('initAuth0', () => {
    //   it('calls the createAuth0Client method', async () => {
    //     // jest.mock('@auth0/auth0-spa-js', () => jest.fn())

    //     // const auth0Client = await createAuth0Client()
    //     // console.log(auth0Client)
    //     // const createAuth0ClientSpy = jest.spyOn(createAuth0Client, '__exists')
    //     await store.dispatch('initAuth0')
    //     expect(createAuth0Client).toHaveBeenCalled()
    //   })
    // })
    describe('authenticate', () => {
      it('calls the isAuthenticated method', async () => {
        await store.dispatch('authenticate')
        expect(isAuthenticated).toHaveBeenCalled()
      })

      it('correctly returns the value of isAuthenticated', async () => {
        let authenticateResult
        isAuthenticated.mockReturnValueOnce(false).mockReturnValueOnce(false)
        authenticateResult = await store.dispatch('authenticate')
        expect(authenticateResult).toBe(false)

        //need this twice as isAuthenticated is called twice
        isAuthenticated.mockReturnValueOnce(true).mockReturnValueOnce(true)
        authenticateResult = await store.dispatch('authenticate')
        expect(store.getters.isAuthenticated).toBe(true)
        expect(authenticateResult).toBe(true)
      })
      //This now uses a timeout - check is timeout called?

      it('gets a token siliently if isAuthenticated returns false', async () => {
        isAuthenticated.mockReturnValueOnce(false).mockReturnValueOnce(false)
        await store.dispatch('authenticate')
        expect(getTokenSilently).toHaveBeenCalled()
      })

      it('calls the redirect callback when "code=" is present in the URL', async () => {
        delete window.location
        window.location = { search: 'code=' }

        await store.dispatch('authenticate')
        expect(handleRedirectCallback).toHaveBeenCalled()
      })

      it('sets the redirect route when one is present in the URL and not in the store', async () => {
        isAuthenticated.mockReturnValueOnce(false)
        await store.dispatch('removeRedirectRoute')

        let redirectRoute = '/path/to/some/place'

        delete window.location
        window.location = { pathname: redirectRoute, search: '' }

        expect(store.getters['redirectRoute']).toBe(null)
        await store.dispatch('authenticate')
        expect(store.getters['redirectRoute']).toBe(redirectRoute)
      })

      it('does not set the redirect route when one is present in the store', async () => {
        isAuthenticated.mockReturnValueOnce(false)

        let redirectRoute = '/path/to/some/place',
          otherRedirectRoute = '/path/to/some/other/place'
        await store.dispatch('setRedirectRoute', redirectRoute)
        expect(store.getters['redirectRoute']).toBe(redirectRoute)

        delete window.location
        window.location = { pathname: otherRedirectRoute, search: '' }

        await store.dispatch('authenticate')
        expect(store.getters['redirectRoute']).not.toBe(otherRedirectRoute)
      })
    })

    describe('authorize', () => {
      describe('user', () => {
        beforeEach(() => {
          getIdTokenClaims.mockReturnValueOnce({
            __raw: MOCK_ID_TOKEN
          })

          prefectAuth.mockReturnValueOnce(MOCK_PREFECT_AUTH_PAYLOAD)
          LogRocket.identify.mockReset()
        })

        it('is retrieved from the auth0Client', async () => {
          await store.dispatch('authorize')
          expect(getUser).toHaveBeenCalled()
        })

        it('is stored', async () => {
          let user = loggedInState().user
          getUser.mockReturnValueOnce(user)
          await store.dispatch('authorize')
          expect(store.getters['user']).toBe(user)
        })

        it('is reported to logrocket it exists', async () => {
          getUser.mockReturnValueOnce(loggedInState().user)
          await store.dispatch('authorize')
          expect(LogRocket.identify).toHaveBeenCalled()
        })
      })

      describe('idToken', () => {
        beforeEach(() => {
          prefectAuth.mockReturnValueOnce(MOCK_PREFECT_AUTH_PAYLOAD)
        })

        it('is stored', () => {
          getIdTokenClaims.mockReturnValueOnce({
            __raw: MOCK_ID_TOKEN
          })

          expect(store.getters['idToken']).toBe(MOCK_ID_TOKEN)
        })
      })

      describe('idTokenExpiry', () => {
        beforeEach(() => {
          prefectAuth.mockReturnValueOnce(MOCK_PREFECT_AUTH_PAYLOAD)
        })

        it('is stored', () => {
          getIdTokenClaims.mockReturnValueOnce({
            __raw: MOCK_ID_TOKEN
          })

          expect(store.getters['idTokenExpiry']).toBe(
            jwt_decode(MOCK_ID_TOKEN).exp * 1000
          )
        })
      })

      describe('prefectAuthorization', () => {
        beforeEach(() => {
          getIdTokenClaims.mockReturnValueOnce({
            __raw: MOCK_ID_TOKEN
          })

          prefectAuth.mockReturnValueOnce(MOCK_PREFECT_AUTH_PAYLOAD)

          LogRocket.identify.mockReset()
        })

        it('is retrieved from the prefectAuth method by passing in the stored idToken', async () => {
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
          getIdTokenClaims.mockReturnValueOnce({
            __raw: MOCK_ID_TOKEN
          })

          prefectRefresh.mockReturnValueOnce(MOCK_PREFECT_AUTH_PAYLOAD)

          LogRocket.identify.mockReset()

          store.commit('authorizationToken', MOCK_AUTHORIZATION_TOKEN)
        })

        it('is retrieved from the prefectAuth method by passing in the stored idToken', async () => {
          store.commit('authorizationToken', MOCK_AUTHORIZATION_TOKEN)
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
          state: auth0.state,
          getters: auth0.getters,
          actions: auth0.actions,
          mutations: auth0.mutations
        })

        isAuthenticated.mockReturnValue(false)

        let user = loggedInState().user
        getUser.mockReturnValue(user)

        getIdTokenClaims.mockReturnValue({
          __raw: MOCK_ID_TOKEN
        })
      })

      afterEach(() => {
        isAuthenticated.mockReset()
        getUser.mockReset()
        getIdTokenClaims.mockReset()
        getTokenSilently.mockReset()
      })

      it('checks authentication once and returns if user is authenticated', async () => {
        isAuthenticated.mockReset()
        isAuthenticated.mockReturnValueOnce(true)

        await store.dispatch('updateAuthentication')

        expect(isAuthenticated).toHaveBeenCalledTimes(1)
      })

      it('checks authentication twice if user is not authenticated', async () => {
        await store.dispatch('updateAuthentication')

        expect(isAuthenticated).toHaveBeenCalledTimes(2)
      })

      it('calls getTokenSilently when not authenticated', async () => {
        await store.dispatch('updateAuthentication')

        expect(getTokenSilently).toHaveBeenCalled()
      })

      it('calls getUser', async () => {
        await store.dispatch('updateAuthentication')

        expect(getUser).toHaveBeenCalled()
      })

      it('commits the results of getUser', async () => {
        store.commit('unsetUser')
        expect(store.getters['user']).toBe(null)

        let user = loggedInState().user
        await store.dispatch('updateAuthentication')
        expect(store.getters['user']).toStrictEqual(user)
      })

      it('commits new idToken', async () => {
        store.commit('idToken', MOCK_ID_TOKEN)
        expect(store.getters['idToken']).toBe(MOCK_ID_TOKEN)

        getIdTokenClaims.mockReset()
        getIdTokenClaims.mockReturnValueOnce({
          __raw: MOCK_ID_TOKEN_2
        })

        await store.dispatch('updateAuthentication')

        expect(getIdTokenClaims).toHaveBeenCalledTimes(1)
        expect(store.getters['idToken']).toBe(MOCK_ID_TOKEN_2)
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

    // describe('login', () => {
    //   it('calls the loginWithRedirect method', async () => {
    //     await store.dispatch('login')
    //     expect(loginWithRedirect).toHaveBeenCalledWith({})
    //   })
    // })

    // describe('logout', () => {
    //   it('removes the redirect route from localStorage', async () => {
    //     let redirectRoute = '/before/logging/out/redirect'
    //     await store.dispatch('setRedirectRoute', redirectRoute)

    //     expect(localStorage.getItem('redirectRoute')).toBe(redirectRoute)

    //     await store.dispatch('logout')
    //     expect(localStorage.getItem('redirectRoute')).toBeFalsy()
    //   })

    //   it('calls the logout method', async () => {
    //     await store.dispatch('logout')
    //     expect(logout).toHaveBeenCalledWith({})
    //   })
    // })

    // describe('setRedirectRoute', () => {
    //   it('sets the redirectRoute', () => {
    //     let somePath = '/some/path'
    //     store.dispatch('setRedirectRoute', somePath)
    //     expect(store.getters['redirectRoute']).toBe(somePath)
    //   })
    // })

    // describe('removeRedirectRoute', () => {
    //   it('removes the redirectRoute', () => {
    //     let somePath = '/some/path'
    //     store.dispatch('setRedirectRoute', somePath)
    //     expect(store.getters['redirectRoute']).toBe(somePath)

    //     store.dispatch('removeRedirectRoute')
    //     expect(store.getters['redirectRoute']).toBe(null)
    //   })
    // })

    // describe('reportUserToLogRocket', () => {
    //   beforeEach(() => {
    //     store = new Vuex.Store({
    //       state: loggedOutState(),
    //       getters: auth0.getters,
    //       actions: auth0.actions,
    //       mutations: auth0.mutations
    //     })

    //     LogRocket.identify.mockReset()
    //   })

    //   it('calls the LogRocket identify method if a user is set', () => {
    //     let user = loggedInState().user
    //     store.commit('user', user)

    //     store.dispatch('reportUserToLogRocket')

    //     expect(LogRocket.identify).toHaveBeenCalled()
    //   })

    //   it('does not call the LogRocket identify method if a user is not set', () => {
    //     store.dispatch('reportUserToLogRocket')

    //     store.commit('unsetUser')

    //     expect(store.getters['user']).toBe(null)

    //     expect(LogRocket.identify).not.toHaveBeenCalled()
    //   })
    // })

    // describe('prefectAuthorization with a non white-listed token', () => {
    //   beforeEach(() => {
    //     const store = new Vuex.Store({
    //       state: auth0.state,
    //       getters: auth0.getters,
    //       actions: auth0.actions,
    //       mutations: auth0.mutations
    //     })

    //     prefectAuth.mockReturnValueOnce(null)

    //     it('is not stored', async () => {
    //       await store.dispatch('authorize')
    //       expect(store.getters['authorizationToken']).toBe(null)
    //       expect(store.getters['refreshToken']).toBe(null)
    //       expect(store.getters['authorizationTokenExpiry']).toBe(null)
    //       expect(store.getters['refreshTokenExpiry']).toBe(null)
    //     })
    //   })
    // })

    // describe('a user comes from an email invite link', () => {
    //   let store

    //   beforeEach(() => {
    //     store = new Vuex.Store({
    //       state: auth0.state,
    //       getters: auth0.getters,
    //       actions: auth0.actions,
    //       mutations: auth0.mutations
    //     })
    //     isAuthenticated.mockReturnValue(false)
    //   })
    //   delete window.location
    //   window.location = { search: '?invitation_id=xyz' }

    //   it('stores the invitation id in local storage', async () => {
    //     await store.dispatch('authenticate')
    //     expect(localStorage.getItem('invitationId')).toBe('xyz')
    //   })
    // })
  })
})
