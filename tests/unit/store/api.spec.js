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
    localStorage.clear()
  })

  describe('State', () => {
    test('backend should be SERVER if neither local storage nor VUE_APP_BACKEND are set', () => {
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
    test('backend should check localstorage', () => {
      const state = localStoreAPIState()
      expect(localStorage.getItem).toBeCalledWith('backend')
      expect(state.backend).toEqual('foo')
      expect(state.serverUrl).toBe('http://0.0.0.0:4200/graphql')
    })
    test('backend should be CLOUD if no localstorage backend and VUE_APP_BACKEND env var is set to CLOUD', () => {
      const state = envVarAPIState()
      expect(localStorage.getItem('backend')).toBe(null)
      expect(state.backend).toEqual('CLOUD')
      expect(state.cloudUrl).toBe('https://api.prefect.io/graphql')
      expect(state.serverUrl).toBe('http://localhost:4200/graphql')
    })

    //   connected: true,
    //   connectionMessage: null,
    //   connectionTimeout: null,
    //   releaseTimestamp: null,
    //   cloudUrl: process.env.VUE_APP_CLOUD_URL,
    //   retries: 0,
    //   serverUrl:
    //     localStorage.getItem('server_url') || process.env.VUE_APP_SERVER_URL,
    //   version: null
    //       expect(state.api.id).toBe(null)
    //       expect(state.api.name).toBe(null)
    //       expect(state.api.info).toBe(null)
    //       expect(state.api.slug).toBe(null)
    //       expect(state.api.role).toBe(null)
    //       expect(Object.keys(state.api.settings).length).toBe(0)
    //       expect(state.api.licenses.length).toBe(0)
    //       expect(state.tenantIsSet).toBe(false)
  })

  describe('getters', () => {
    let store
    const state = initialAPIState
    store = new Vuex.Store({
      state: state,
      getters: api.getters,
      mutations: api.mutations
    })

    it('should return when backend is called', () => {
      localStorage.setItem('backend', 'bar')
      store.commit('setBackend', 'boo')
      // console.log(store.state.backend, process.env.VUE_APP_BACKEND)
      expect(store.getters.backend).toBe('boo')
      expect(localStorage.getItem('backend')).toBe('boo')
      expect(localStorage.getItem).toBeCalledWith('backend')
    })
    // it('should return if api is set as boolean when tenantIsSet getter is called', () => {
    //   expect(store.getters.tenantIsSet).toBe(store.state.tenantIsSet)
    // })
    // testing this works in both types of state
    // store = new Vuex.Store({
    //   state: loggedinTenantState(),
    //   getters: api.getters,
    //   mutations: api.mutations
    // })
    // it('should return api object when api getter is called', () => {
    //   expect(store.getters.api).toBe(store.state.api)
    // })
    // it('should return if api is set as boolean when tenantIsSet getter is called', () => {
    //   expect(store.getters.tenantIsSet).toBe(store.state.tenantIsSet)
    // })
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
