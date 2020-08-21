import api from '@/store/api'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

jest.mock('@/graphql/api.gql', () => 'api mutation string')
jest.mock('@/vue-apollo', () => {
  return {}
})

describe('API Vuex Module', () => {
  let initialAPIState
  let envVarAPIState
  let localStoreAPIState

  beforeEach(() => {
    initialAPIState = () => {
      delete process.env.VUE_APP_BACKEND
      delete process.env.VUE_APP_CLOUD_URL
      delete process.env.VUE_APP_SERVER_URL
      localStorage.clear()
      return {
        backend:
          localStorage.getItem('backend') ||
          process.env.VUE_APP_BACKEND ||
          'SERVER',
        connected: true,
        connectionMessage: null,
        connectionTimeout: null,
        releaseTimestamp: null,
        cloudUrl: process.env.VUE_APP_CLOUD_URL,
        retries: 0,
        serverUrl:
          localStorage.getItem('server_url') || process.env.VUE_APP_SERVER_URL,
        version: null
      }
    }
    envVarAPIState = () => {
      localStorage.clear()
      process.env.VUE_APP_BACKEND = 'CLOUD'
      process.env.VUE_APP_CLOUD_URL = 'https://api.prefect.io/graphql'
      process.env.VUE_APP_SERVER_URL = 'http://localhost:4200/graphql'
      return {
        backend:
          localStorage.getItem('backend') ||
          process.env.VUE_APP_BACKEND ||
          'SERVER',
        connected: true,
        connectionMessage: null,
        connectionTimeout: null,
        releaseTimestamp: null,
        cloudUrl: process.env.VUE_APP_CLOUD_URL,
        retries: 0,
        serverUrl:
          localStorage.getItem('server_url') || process.env.VUE_APP_SERVER_URL,
        version: null
      }
    }
    localStoreAPIState = () => {
      localStorage.setItem('backend', 'foo')
      localStorage.setItem('server_url', 'http://0.0.0.0:4200/graphql')
      process.env.VUE_APP_BACKEND = 'CLOUD'
      process.env.VUE_APP_SERVER_URL = 'http://localhost:4200/graphql'
      return {
        backend:
          localStorage.getItem('backend') ||
          process.env.VUE_APP_BACKEND ||
          'SERVER',
        connected: true,
        connectionMessage: null,
        connectionTimeout: null,
        releaseTimestamp: null,
        cloudUrl: process.env.VUE_APP_CLOUD_URL,
        retries: 0,
        serverUrl:
          localStorage.getItem('server_url') || process.env.VUE_APP_SERVER_URL,
        version: null
      }
    }
  })

  describe('State', () => {
    test('state returns correct values if no localStorage or environment variables are set', () => {
      const state = initialAPIState()
      expect(state.backend).toEqual('SERVER')
      expect(state.connected).toBe(true)
      expect(state.connectionMessage).toBe(null)
      expect(state.connectionTimeout).toBe(null)
      expect(state.cloudUrl).toBe(undefined)
      expect(state.retries).toBe(0)
      expect(state.serverUrl).toBe(undefined)
      expect(state.version).toBe(null)
    })
    test('state checks local storage before environment variables', () => {
      const state = localStoreAPIState()
      expect(localStorage.getItem).toBeCalledWith('backend')
      expect(state.backend).toEqual('foo')
      expect(state.serverUrl).toBe('http://0.0.0.0:4200/graphql')
    })
    test('state checks environment variables if no local storage', () => {
      const state = envVarAPIState()
      expect(localStorage.getItem('backend')).toBe(null)
      expect(state.backend).toEqual('CLOUD')
      expect(state.cloudUrl).toBe('https://api.prefect.io/graphql')
      expect(state.serverUrl).toBe('http://localhost:4200/graphql')
    })
  })

  describe('getters when no local storage or environment variable is set', () => {
    let store
    beforeEach(() => {
      const state = initialAPIState()
      store = new Vuex.Store({
        state: state,
        getters: api.getters,
        mutations: api.mutations
      })
    })
    it('should return the backend', () => {
      expect(store.getters.backend).toBe('SERVER')
    })
    it('should return connected state', () => {
      expect(store.getters.connected).toBe(true)
    })
    it('should return connecting state', () => {
      expect(store.getters.connecting).toBe(false)
    })
    it('should return the connection message', () => {
      expect(store.getters.connectionMessage).toBe(null)
    })
    it('should return the connectionTimeout', () => {
      expect(store.getters.connectionTimeout).toBe(null)
    })
    it('should return a boolean about whether the backend is Cloud', () => {
      expect(store.getters.isCloud).toBe(false)
    })
    it('should return a boolean about whether the backend is Server', () => {
      expect(store.getters.isServer).toBe(true)
    })
    it('should return the cloud url', () => {
      expect(store.getters.cloudUrl).toBe(undefined)
    })
    it('should return retries', () => {
      expect(store.getters.retries).toBe(0)
    })
    it('should return the server url', () => {
      expect(store.getters.serverUrl).toBe(undefined)
    })
    it('should return the active url', () => {
      expect(store.getters.url).toBe(undefined)
    })
    it('should return the version', () => {
      expect(store.getters.version).toBe(null)
    })
  })

  describe('where relevant getters check local storage before environment variables', () => {
    let store
    beforeEach(() => {
      const state = localStoreAPIState()
      store = new Vuex.Store({
        state: state,
        getters: api.getters,
        mutations: api.mutations
      })
    })
    it('should return the backend', () => {
      expect(store.getters.backend).toBe('foo')
    })
    it('should return a boolean about whether the backend is Cloud', () => {
      expect(store.getters.isCloud).toBe(false)
    })
    it('should return a boolean about whether the backend is Server', () => {
      expect(store.getters.isServer).toBe(false)
    })
    it('should return the cloud url', () => {
      expect(store.getters.cloudUrl).toBe(undefined)
    })
    it('should return the server url', () => {
      expect(store.getters.serverUrl).toBe('http://0.0.0.0:4200/graphql')
    })
    it('should return the active url', () => {
      expect(store.getters.url).toBe(null)
    })
  })

  describe('where relevant getters check environment variables if no local storage', () => {
    let store
    beforeEach(() => {
      const state = envVarAPIState()
      store = new Vuex.Store({
        state: state,
        getters: api.getters,
        mutations: api.mutations
      })
    })

    it('should return the backend', () => {
      expect(store.getters.backend).toBe('CLOUD')
    })
    it('should return a boolean about whether the backend is Cloud', () => {
      expect(store.getters.isCloud).toBe(true)
    })
    it('should return a boolean about whether the backend is Server', () => {
      expect(store.getters.isServer).toBe(false)
    })
    it('should return the cloud url', () => {
      expect(store.getters.cloudUrl).toBe('https://api.prefect.io/graphql')
    })
    it('should return the server url', () => {
      expect(store.getters.serverUrl).toBe('http://localhost:4200/graphql')
    })
    it('should return the active url', () => {
      expect(store.getters.url).toBe('https://api.prefect.io/graphql')
    })
  })

  describe('Mutations', () => {
    let store

    beforeEach(() => {
      store = new Vuex.Store({
        state: initialAPIState(),
        getters: api.getters,
        actions: api.actions,
        mutations: api.mutations
      })
    })
    describe('setBackend', () => {
      it('should set backend', () => {
        store.commit('setBackend', '42')
        expect(store.getters['backend']).toBe('42')
        expect(store.getters['isCloud']).toBe(false)
        store.commit('setBackend', 'CLOUD')
        expect(store.getters['backend']).toBe('CLOUD')
        expect(store.getters['isCloud']).toBe(true)
      })
    })

    describe('unsetBackend', () => {
      it('should set backend to null', () => {
        store.commit('unsetBackend')
        expect(store.getters['backend']).toEqual(null)
      })
      it('should remove backend from localstorage', () => {
        store.commit('setBackend', 'earth')
        expect(store.getters['backend']).toEqual('earth')
        expect(localStorage.getItem('backend')).toEqual('earth')
        store.commit('unsetBackend')
        expect(store.getters['backend']).toBe(null)
        expect(localStorage.getItem('backend')).toBe(null)
      })
    })

    describe('setConnected', () => {
      it('should update connected', () => {
        expect(store.getters['connected']).toBe(true)
        store.commit('setConnected', false)
        expect(store.getters['connected']).toBe(false)
      })
    })
  })
})
