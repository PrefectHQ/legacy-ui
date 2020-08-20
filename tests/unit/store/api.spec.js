import api from '@/store/api'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
// require('dotenv').config()

const localVue = createLocalVue()
localVue.use(Vuex)

jest.mock('@/graphql/api.gql', () => 'api mutation string')
jest.mock('@/vue-apollo', () => {
  return {}
})

describe('API Vuex Module', () => {
  const initialAPIState = () => {
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

  const OLD_ENV = process.env
  const originalLocal = global.localStorage

  beforeEach(() => {
    // jest.resetModules() // clear the cache
    // process.env = { ...OLD_ENV, VUE_APP_BACKEND: 33 } // make a copy

    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn()
    }
    global.localStorage = localStorageMock
  })

  afterAll(() => {
    // process.env = OLD_ENV // restore old env
    global.localStorage = originalLocal
  })

  describe('State', () => {
    beforeEach(() => localStorage.clear())

    test('backend should pull from local storage first, then environment variables and then, if those are null, use SERVER string', () => {
      const state = api.state
      console.log('env', process.env)
      //   expect(localStorage.store).toEqual({})
      process.env.VUE_APP_BACKEND = 'spagetti'
      console.log('env2', process.env)
      expect(state.backend).toBe('SERVER')
      expect(localStorage.getItem).toBeCalledWith('backend')
      //   localStorage.setItem('backend', 'bar')
      //   expect(localStorage.store).toEqual({ backend: 'bar' })
      //   expect(localStorage.getItem('backend').toEqual('bar'))
      //   expect(state.backend).toEqual('bar')
      //     localStorage.getItem('backend') || process.env.VUE_APP_BACKEND || 'SERVER',
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
  })

  describe('getters', () => {
    let store
    store = new Vuex.Store({
      state: initialAPIState(),
      getters: api.getters,
      mutations: api.mutations
    })

    it('should return when backend is called', () => {
      process.env['VUE_APP_BACKEND'] = 'spagetti'
      expect(store.getters.backend).toBe('fish')
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
