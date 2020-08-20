import api from '@/store/api'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
// import mockLocalStorage from './mocklocalstorage.js'

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock

const localVue = createLocalVue()
localVue.use(Vuex)

jest.mock('@/graphql/api.gql', () => 'api mutation string')
jest.mock('@/vue-apollo', () => {
  return {}
})

describe('api Vuex Module', () => {
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

  const loggedinTenantState = () => {
    return {
      api: {
        id: 'd38b31a7-d570-4f0c-911d-dcaab5cec3d0',
        name: 'Test Technologies Inc.',
        info: null,
        slug: 'test',
        role: 'TENANT_ADMIN',
        settings: { teamNamed: true, agreedToLicense: false },
        prefectAdminSettings: {},
        licenses: [{ active: true, product: 'Prefect Cloud Platform' }]
      },
      tenantIsSet: true
    }
  }

  describe('State', () => {
    beforeEach(() => localStorage.clear())

    test('backend should pull from local storage first, then environment variables and then, if those are null, use SERVER string', () => {
      const state = api.state
      //   expect(localStorage.store).toEqual({})
      expect(state.backend).toBe('SERVER')
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
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn()
    }
    const originalLocal = global.localStorage
    global.localStorage = localStorageMock

    it('should return check local storage when backend is called', () => {
      expect(store.getters.backend).toBe(store.state.backend)
      // assertions as usual:
      expect(localStorage.getItem).toBeCalledWith('backend22')
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
    global.localStorage = originalLocal
  })
  describe('Mutations', () => {
    let store

    beforeEach(() => {
      store = new Vuex.Store({
        state: initialApiState(),
        getters: api.getters,
        actions: api.actions,
        mutations: api.mutations
      })
    })
    describe('setTenant', () => {
      it('should set tenantIsSet to true', () => {
        store.commit('setTenant', loggedinTenantState().api)
        expect(store.getters['tenantIsSet']).toBe(true)
        expect(store.getters['api']).toEqual(loggedinTenantState().api)
      })
      it('should throw an error if given no api', () => {
        store.commit('unsetTenant')
        expect(() => store.commit('setTenant')).toThrow(
          'passed invalid or empty api object'
        )
      })
    })
    describe('unsetTenant', () => {
      it('should set tenantIsSet to false', () => {
        //Make sure store is in logged in state
        store.commit('setTenant', loggedinTenantState().api)
        expect(store.getters['api']).toEqual(loggedinTenantState().api)
        store.commit('unsetTenant')
        expect(store.getters['tenantIsSet']).toBe(false)
        expect(store.getters['api']).toEqual(initialApiState().api)
      })
    })
    describe('updateTenantSettings', () => {
      it('should update the settings in the store and leave the rest of the api as is', () => {
        //Make sure store is in logged in state
        store.commit('setTenant', loggedinTenantState().api)
        expect(store.getters['api']).toEqual(loggedinTenantState().api)
        expect(store.getters['tenantIsSet']).toEqual(
          loggedinTenantState().tenantIsSet
        )
        store.commit('updateTenantSettings', { agreedToLicense: true })
        expect(store.getters['api']).toEqual({
          ...loggedinTenantState().api,
          settings: { agreedToLicense: true }
        })
      })
      it('should throw an error message if no settings are passed', () => {
        expect(() => store.commit('updateTenantSettings')).toThrow(
          'passed invalid or empty settings object'
        )
      })
    })
  })
})
