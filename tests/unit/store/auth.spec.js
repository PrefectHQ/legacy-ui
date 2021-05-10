import auth_base from '@/store/auth'

const auth = { ...auth_base }

import {
  MOCK_AUTHORIZATION_TOKEN,
  MOCK_ID_TOKEN,
  MOCK_REFRESH_TOKEN
} from './mockTokens'

import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('auth Vuex Module', () => {
  const loggedInState = () => {
    return {
      authorizationToken: MOCK_AUTHORIZATION_TOKEN,
      authorizationTokenExpiry: new Date().getTime() + 10000,
      idToken: MOCK_ID_TOKEN,
      idTokenExpiry: new Date().getTime() + 10000,
      isAuthenticated: true,
      refreshToken: MOCK_REFRESH_TOKEN,
      refreshTokenExpiry: new Date().getTime() + 10000,
      user: {
        sub: 'user',
        name: 'user',
        email: 'user@domain.com'
      }
    }
  }

  describe('State', () => {
    it('should be initialized properly without tokens in localStorage ', () => {
      const state = auth.state

      expect(Object.keys(state).length).toBe(7)

      expect(state.user).toBe(null)
      expect(state.authorizationToken).toBe(null)
      expect(state.authorizationTokenExpiry).toBe(null)
      expect(state.idToken).toBe(null)
      expect(state.idTokenExpiry).toBe(null)
      expect(state.refreshToken).toBe(null)
      expect(state.refreshTokenExpiry).toBe(null)
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

    it('should return the idToken', () => {
      expect(store.getters.idToken).toBe(store.state.idToken)
    })

    it('should return isAuthenticated', () => {
      expect(store.getters.isAuthenticated).toBe(true)
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
    })
  })
})
