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

  describe('getters', () => {
    test('getters should return correct values when no local storage or environment variable is set', () => {
      let store
      const state = initialAPIState()
      store = new Vuex.Store({
        state: state,
        getters: api.getters,
        mutations: api.mutations
      })
      expect(store.getters.backend).toBe('SERVER')
      expect(store.getters.connected).toBe(true)
      expect(store.getters.connecting).toBe(false)
      expect(store.getters.connectionMessage).toBe(null)
      expect(store.getters.connectionTimeout).toBe(null)
      expect(store.getters.isCloud).toBe(false)
      expect(store.getters.isServer).toBe(true)
      expect(store.getters.cloudUrl).toBe(undefined)
      expect(store.getters.retries).toBe(0)
      expect(store.getters.serverUrl).toBe(undefined)
      expect(store.getters.url).toBe(undefined)
      expect(store.getters.version).toBe(null)
    })
    test('where relevant getters check local storage before environment variables', () => {
      let store
      const state = localStoreAPIState()
      store = new Vuex.Store({
        state: state,
        getters: api.getters,
        mutations: api.mutations
      })
      expect(store.getters.backend).toBe('foo')
      expect(store.getters.isCloud).toBe(false)
      expect(store.getters.isServer).toBe(false)
      expect(store.getters.cloudUrl).toBe(undefined)
      expect(store.getters.serverUrl).toBe('http://0.0.0.0:4200/graphql')
      expect(store.getters.url).toBe(null)
    })
    test('where relevant getters check environment variables if no local storage', () => {
      let store
      const state = envVarAPIState()
      store = new Vuex.Store({
        state: state,
        getters: api.getters,
        mutations: api.mutations
      })
      expect(store.getters.backend).toBe('CLOUD')
      expect(store.getters.isCloud).toBe(true)
      expect(store.getters.isServer).toBe(false)
      expect(store.getters.cloudUrl).toBe('https://api.prefect.io/graphql')
      expect(store.getters.serverUrl).toBe('http://localhost:4200/graphql')
      expect(store.getters.url).toBe('https://api.prefect.io/graphql')
    })
  })

  // describe('Mutations', () => {
  //   let store

  //   beforeEach(() => {
  //     store = new Vuex.Store({
  //       state: initialAPIState(),
  //       getters: api.getters,
  //       actions: api.actions,
  //       mutations: api.mutations
  //     })
  //   })
  //   describe('setTenant', () => {
  //     it('should set tenantIsSet to true', () => {
  //       store.commit('setTenant', loggedinTenantState().api)
  //       expect(store.getters['tenantIsSet']).toBe(true)
  //       expect(store.getters['api']).toEqual(loggedinTenantState().api)
  //     })
  //     it('should throw an error if given no api', () => {
  //       store.commit('unsetTenant')
  //       expect(() => store.commit('setTenant')).toThrow(
  //         'passed invalid or empty api object'
  //       )
  //     })
  //   })
  //   describe('unsetTenant', () => {
  //     it('should set tenantIsSet to false', () => {
  //       //Make sure store is in logged in state
  //       store.commit('setTenant', loggedinTenantState().api)
  //       expect(store.getters['api']).toEqual(loggedinTenantState().api)
  //       store.commit('unsetTenant')
  //       expect(store.getters['tenantIsSet']).toBe(false)
  //       expect(store.getters['api']).toEqual(initialAPIState().api)
  //     })
  //   })
  //   describe('updateTenantSettings', () => {
  //     it('should update the settings in the store and leave the rest of the api as is', () => {
  //       //Make sure store is in logged in state
  //       store.commit('setTenant', loggedinTenantState().api)
  //       expect(store.getters['api']).toEqual(loggedinTenantState().api)
  //       expect(store.getters['tenantIsSet']).toEqual(
  //         loggedinTenantState().tenantIsSet
  //       )
  //       store.commit('updateTenantSettings', { agreedToLicense: true })
  //       expect(store.getters['api']).toEqual({
  //         ...loggedinTenantState().api,
  //         settings: { agreedToLicense: true }
  //       })
  //     })
  //     it('should throw an error message if no settings are passed', () => {
  //       expect(() => store.commit('updateTenantSettings')).toThrow(
  //         'passed invalid or empty settings object'
  //       )
  //     })
  //   })
  // })
})
