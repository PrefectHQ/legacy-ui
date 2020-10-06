import api from '@/store/api'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
jest.useFakeTimers()

const SERVER_KEY = `${process.env.VUE_APP_RELEASE_TIMESTAMP}_server_url`

//simple mock for gql api query
let mockerror = false

jest.mock('@/vue-apollo', () => {
  return {
    fallbackApolloClient: {
      query: () => {
        if (!mockerror) {
          return {
            data: {
              api: {
                release_timestamp: 'timestamp',
                version: 2,
                mode: 'maintenance'
              }
            }
          }
        } else {
          return { data: 'error' }
        }
      }
    }
  }
})

const localVue = createLocalVue()
localVue.use(Vuex)

jest.mock('@/graphql/api.gql', () => 'api mutation string')

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
        apiMode: null,
        releaseTimestamp: null,
        cloudUrl: process.env.VUE_APP_CLOUD_URL,
        retries: 0,
        serverUrl:
          localStorage.getItem(SERVER_KEY) || process.env.VUE_APP_SERVER_URL,
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
        connectionTimeout: 200,
        releaseTimestamp: null,
        apiMode: null,
        cloudUrl: process.env.VUE_APP_CLOUD_URL,
        retries: 0,
        serverUrl:
          localStorage.getItem(SERVER_KEY) || process.env.VUE_APP_SERVER_URL,
        version: null
      }
    }
    localStoreAPIState = () => {
      localStorage.setItem('backend', 'foo')
      localStorage.setItem(SERVER_KEY, 'http://0.0.0.0:4200/graphql')
      process.env.VUE_APP_BACKEND = 'CLOUD'
      process.env.VUE_APP_SERVER_URL = 'http://localhost:4200/graphql'
      return {
        backend:
          localStorage.getItem('backend') ||
          process.env.VUE_APP_BACKEND ||
          'SERVER',
        connected: true,
        connectionMessage: 'connection message',
        connectionTimeout: 300,
        apiMode: null,
        releaseTimestamp: 'xxxxxx',
        cloudUrl: process.env.VUE_APP_CLOUD_URL,
        retries: 5,
        serverUrl:
          localStorage.getItem(SERVER_KEY) || process.env.VUE_APP_SERVER_URL,
        version: 8
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
      expect(state.apiMode).toBe(null)
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
    it('should return the api mode', () => {
      expect(store.getters.apiMode).toBe(null)
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
        store.commit('setBackend', 'SERVER')
        expect(store.getters['backend']).toBe('SERVER')
        expect(store.getters['isCloud']).toBe(false)
        store.commit('setBackend', 'CLOUD')
        expect(store.getters['backend']).toBe('CLOUD')
        expect(store.getters['isCloud']).toBe(true)
      })
      it('should throw an error if an invalid backend is used', () => {
        expect(() => store.commit('setBackend', 'FOO')).toThrow(
          'Invalid backend'
        )
      })
    })

    describe('unsetBackend', () => {
      it('should set backend to null', () => {
        store.commit('unsetBackend')
        expect(store.getters['backend']).toEqual(null)
      })
      it('should remove backend from localstorage', () => {
        store.commit('setBackend', 'CLOUD')
        expect(store.getters['backend']).toEqual('CLOUD')
        expect(localStorage.getItem('backend')).toEqual('CLOUD')
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
      it('should throw an error if it tries to set connected to a non-boolean', () => {
        expect(store.getters['connected']).toBe(true)
        expect(() => store.commit('setConnected', 'tiger')).toThrow(
          'Invalid connected state - connected should be a boolean'
        )
      })
    })

    describe('setConnectionMessage', () => {
      it('should update the connection message', () => {
        expect(store.getters['connectionMessage']).toBe(null)
        store.commit('setConnectionMessage', 'hello')
        expect(store.getters['connectionMessage']).toBe('hello')
      })
    })

    describe('unsetConnectionMessage', () => {
      it('should unset the connection message', () => {
        store.commit('setConnectionMessage', 'hello')
        expect(store.getters['connectionMessage']).toBe('hello')
        store.commit('unsetConnectionMessage')
        expect(store.getters['connectionMessage']).toBe(null)
      })
    })

    describe('setConnectionTimeout', () => {
      it('should set ConnectionTimeout', () => {
        store.commit('setConnectionTimeout', 500)
        expect(store.getters['connectionTimeout']).toBe(500)
      })
    })

    describe('unsetConnectionTimeout', () => {
      it('should unset ConnectionTimeout', () => {
        store.commit('setConnectionTimeout', 500)
        expect(store.getters['connectionTimeout']).toBe(500)
        store.commit('unsetConnectionTimeout')
        expect(store.getters['connectionTimeout']).toBe(null)
        expect(clearTimeout).toHaveBeenCalled()
      })
    })

    describe('setReleaseTimestamp', () => {
      it('should set the release timestamp', () => {
        store.commit('setReleaseTimestamp', 'a timestamp')
        expect(store.getters['releaseTimestamp']).toBe('a timestamp')
      })
    })

    describe('setApiMode', () => {
      it('should set the api mode', () => {
        store.commit('setApiMode', 'normal')
        expect(store.getters['apiMode']).toBe('normal')
        store.commit('setApiMode', 'maintenance')
        expect(store.getters['apiMode']).toBe('maintenance')
      })
      it('should throw an error if we try to set an api model other than normal or maintenance', () => {
        expect(() => store.commit('setApiMode', 'notnormal')).toThrow(
          'Unexpected api mode'
        )
      })
    })

    describe('unsetReleaseTimestamp', () => {
      it('should unset releaseTimestamp', () => {
        store.commit('setReleaseTimestamp', 'a timestamp')
        expect(store.getters['releaseTimestamp']).toBe('a timestamp')
        store.commit('unsetReleaseTimetamp')
        expect(store.getters['releaseTimestamp']).toBe(null)
      })
    })

    describe('setRetries', () => {
      it('should set retries', () => {
        store.commit('setRetries', 5)
        expect(store.getters['retries']).toBe(5)
      })
    })

    describe('setServerUrl', () => {
      it('should set the server url in state and local storage', () => {
        store.commit('setServerUrl', 'http:localhost:4200')
        expect(store.getters['serverUrl']).toEqual('http:localhost:4200')
        expect(localStorage.setItem).toBeCalledWith(
          SERVER_KEY,
          'http:localhost:4200'
        )
      })
    })

    describe('unsetServerUrl', () => {
      it('should unset the server url in state and local storage', () => {
        store.commit('unsetServerUrl')
        expect(store.getters['serverUrl']).toEqual(null)
        expect(localStorage.removeItem).toBeCalledWith(SERVER_KEY)
      })
    })

    describe('setVersion', () => {
      it('should set the version', () => {
        store.commit('setVersion', 2)
        expect(store.getters['version']).toBe(2)
      })
    })

    describe('unsetVersion', () => {
      it('should unset the version', () => {
        store.commit('setVersion', 2)
        expect(store.getters['version']).toBe(2)
        store.commit('unsetVersion')
        expect(store.getters['version']).toBe(null)
      })
    })
  })

  describe('actions', () => {
    let store
    beforeEach(() => {
      const state = initialAPIState()
      store = new Vuex.Store({
        state: state,
        getters: api.getters,
        mutations: api.mutations,
        actions: api.actions
      })
    })

    describe('getApi - no api error', () => {
      beforeEach(() => {
        mockerror = false
      })
      it('should set the version', async () => {
        await store.dispatch('getApi')
        expect(store.getters.version).toBe(2)
      })
      it('should set the release timestamp', async () => {
        await store.dispatch('getApi')
        expect(store.getters.releaseTimestamp).toBe('timestamp')
      })
      it('should set connected state', async () => {
        await store.dispatch('getApi')
        expect(store.getters.connected).toBe(true)
      })
      it('should set api mode', async () => {
        await store.dispatch('getApi')
        expect(store.getters.apiMode).toBe('maintenance')
      })
    })

    describe('getApi - with api error', () => {
      beforeEach(() => {
        mockerror = true
        const state = localStoreAPIState()
        store = new Vuex.Store({
          state: state,
          getters: api.getters,
          mutations: api.mutations,
          actions: api.actions
        })
      })
      it('should unset the version', async () => {
        expect(store.getters.version).toBe(8)
        await store.dispatch('getApi')
        expect(store.getters.version).toBe(null)
      })
      it('should unset the release timestamp', async () => {
        await store.dispatch('getApi')
        expect(store.getters.releaseTimestamp).toBe(null)
      })
      it('should unset connected state', async () => {
        await store.dispatch('getApi')
        expect(store.getters.connected).toBe(false)
      })
    })

    describe('monitorConnection - no query error', () => {
      beforeEach(() => {
        mockerror = false
        const state = localStoreAPIState()
        store = new Vuex.Store({
          state: state,
          getters: api.getters,
          mutations: api.mutations,
          actions: api.actions
        })
      })
      it('should unset connection timeout', async () => {
        await store.dispatch('monitorConnection')
        expect(clearTimeout).toHaveBeenCalled()
      })
      it('should set the release timestamp', async () => {
        await store.dispatch('monitorConnection')
        expect(store.getters.releaseTimestamp).toBe('timestamp')
      })
      it('should set connected state', async () => {
        await store.dispatch('monitorConnection')
        expect(store.getters.connected).toBe(true)
      })
      it('should set the version', async () => {
        await store.dispatch('monitorConnection')
        expect(store.getters.version).toBe(2)
      })
      it('should set the connection message', async () => {
        await store.dispatch('monitorConnection')
        expect(store.getters.connectionMessage).toBe('Connected')
      })
      it('should set retries back to 0', async () => {
        await store.dispatch('monitorConnection')
        expect(store.getters.retries).toBe(0)
      })
    })

    describe('monitorConnection - query error', () => {
      beforeEach(() => {
        mockerror = true
        const state = localStoreAPIState()
        store = new Vuex.Store({
          state: state,
          getters: api.getters,
          mutations: api.mutations,
          actions: api.actions
        })
      })
      it('should unset connection timeout', async () => {
        await store.dispatch('monitorConnection')
        expect(clearTimeout).toHaveBeenCalled()
      })
      it('should set connected state to false', async () => {
        await store.dispatch('monitorConnection')
        expect(store.getters.connected).toBe(false)
      })
      it('should set the connection message', async () => {
        await store.dispatch('monitorConnection')
        expect(store.getters.connectionMessage).toBe(
          "TypeError: Cannot read property 'release_timestamp' of undefined"
        )
      })
    })

    describe('setServerUrl', () => {
      beforeEach(() => {
        const state = localStoreAPIState()
        store = new Vuex.Store({
          state: state,
          getters: api.getters,
          mutations: api.mutations,
          actions: api.actions
        })
      })
      it('should set the server URL', async () => {
        expect(store.getters.serverUrl).toBe('http://0.0.0.0:4200/graphql')
        await store.dispatch('setServerUrl', 'new.url')
        expect(store.getters.serverUrl).toBe('new.url')
      })
    })

    describe('switchBackend', () => {
      beforeEach(() => {
        // Mock the mutations and actions from other stores
        // that we don't want to
        // test here
        api.mutations['tenant/setTenant'] = jest.fn()
        api.mutations['tenant/setDefaultTenant'] = jest.fn()
        api.mutations['tenant/unsetTenants'] = jest.fn()
        api.mutations['tenant/unsetTenant'] = jest.fn()
        api.actions['tenant/getTenants'] = jest.fn()
        api.actions['auth0/authenticate'] = jest.fn()
        api.actions['auth0/authorize'] = jest.fn()
        api.actions['user/getUser'] = jest.fn()

        const state = localStoreAPIState()
        store = new Vuex.Store({
          state: state,
          getters: api.getters,
          mutations: api.mutations,
          actions: api.actions
        })
      })

      it('should call unsetTenant', async () => {
        await store.dispatch('switchBackend', 'SERVER')
        expect(api.mutations['tenant/unsetTenant']).toHaveBeenCalled()
      })
      it('should call unsetTenants', async () => {
        await store.dispatch('switchBackend', 'SERVER')
        expect(api.mutations['tenant/unsetTenants']).toHaveBeenCalled()
      })

      describe('switch backend to SERVER', () => {
        it('should set the backend to SERVER', async () => {
          expect(store.getters.backend).toBe('foo')
          await store.dispatch('switchBackend', 'SERVER')
          expect(store.getters.backend).toBe('SERVER')
        })
        it('should call unsetTenant', async () => {
          await store.dispatch('switchBackend', 'SERVER')
          expect(api.mutations['tenant/unsetTenant']).toHaveBeenCalled()
        })
        it('should call unsetTenants', async () => {
          await store.dispatch('switchBackend', 'SERVER')
          expect(api.mutations['tenant/unsetTenants']).toHaveBeenCalled()
        })
        it('should call setDefaultTenant', async () => {
          await store.dispatch('switchBackend', 'SERVER')
          expect(api.mutations['tenant/setDefaultTenant']).toHaveBeenCalled()
        })
      })

      describe('switch backend to CLOUD', () => {
        it('should set the backend to CLOUD', async () => {
          expect(store.getters.backend).toBe('foo')
          await store.dispatch('switchBackend', 'CLOUD')
          expect(store.getters.backend).toBe('CLOUD')
        })
        it('should not call setDefaultTenant', async () => {
          await store.dispatch('switchBackend', 'CLOUD')
          expect(
            api.mutations['tenant/setDefaultTenant']
          ).toHaveBeenCalledTimes(0)
        })
        it('should authenticate', async () => {
          await store.dispatch('switchBackend', 'CLOUD')
          expect(api.actions['auth0/authenticate']).toHaveBeenCalled()
        })
        it('should authorize', async () => {
          await store.dispatch('switchBackend', 'CLOUD')
          expect(api.actions['auth0/authorize']).toHaveBeenCalled()
        })
        it('should get the user details', async () => {
          await store.dispatch('switchBackend', 'CLOUD')
          expect(api.actions['user/getUser']).toHaveBeenCalled()
        })
        it('should get tenants', async () => {
          await store.dispatch('switchBackend', 'CLOUD')
          expect(api.actions['tenant/getTenants']).toHaveBeenCalled()
        })
      })
    })
  })
})
