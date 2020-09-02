import tenant from '@/store/tenant'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

jest.mock(
  '@/graphql/Tenant/tenant-token.gql',
  () => 'tenant token mutation string'
)

jest.mock('vue-cli-plugin-apollo/graphql-client', () => {
  class ApolloClient {
    mutate() {
      return { data: 'hello' }
    }
  }
  const createApolloClient = () => {
    return { ApolloClient: new ApolloClient() }
  }
  return { createApolloClient }
})

jest.mock('@/vue-apollo', () => {
  return {}
})

jest.mock(
  '@/graphql/Tenant/membership.gql',
  () => 'tenant membership query string'
)
jest.mock('@/graphql/Mutations/update-tenant-settings.gql', () => {
  return {
    response: { data: { updateTenantSettings: { tenant: { settings: {} } } } }
  }
})

describe('tenant Vuex Module', () => {
  const initialTenantState = () => {
    return {
      defaultTenant: null,
      tenant: {
        id: null,
        name: null,
        info: null,
        slug: null,
        role: null,
        settings: {},
        prefectAdminSettings: {},
        licenses: [],
        stripeCustomerID: ''
      },
      tenantIsSet: false,
      tenants: []
    }
  }

  const loggedinTenantState = () => {
    return {
      defaultTenant: { name: 'TestTenant', slug: 'test', id: 'XXXXXXXXXX' },
      tenant: {
        id: 'd38b31a7-d570-4f0c-911d-dcaab5cec3d0',
        name: 'Test Technologies Inc.',
        info: null,
        slug: 'test',
        role: 'TENANT_ADMIN',
        settings: { teamNamed: true, agreedToLicense: false },
        prefectAdminSettings: {},
        licenses: [{ active: true, product: 'Prefect Cloud Platform' }]
      },
      tenantIsSet: true,
      tenants: [
        { name: 'TestTenant', slug: 'test', id: 'XXXXXXXXXX' },
        { name: 'TestTenant2', slug: 'testy', id: 'YYYYYYYYY' }
      ]
    }
  }

  describe('State', () => {
    it('should be initally be empty (set to false or null)', () => {
      const state = tenant.state
      expect(state.defaultTenant).toBe(null)
      expect(state.tenant.id).toBe(null)
      expect(state.tenant.name).toBe(null)
      expect(state.tenant.info).toBe(null)
      expect(state.tenant.slug).toBe(null)
      expect(state.tenant.role).toBe(null)
      expect(Object.keys(state.tenant.settings).length).toBe(0)
      expect(state.tenant.licenses.length).toBe(0)
      expect(state.tenantIsSet).toBe(false)
      expect(state.tenants.length).toBe(0)
    })
  })

  describe('getters with initial tenant state', () => {
    let store
    beforeEach(() => {
      store = new Vuex.Store({
        state: initialTenantState(),
        getters: tenant.getters,
        actions: tenant.actions,
        mutations: tenant.mutations
      })
    })
    it('should return null and false when tenant getter is called on initialTenantState', () => {
      store = new Vuex.Store({
        state: initialTenantState(),
        getters: tenant.getters,
        mutations: tenant.mutations
      })
      expect(store.getters.tenant).toEqual(initialTenantState().tenant)
    })
    it('should return false if tenantIsSet getter is called on intitalTenantState', () => {
      store = new Vuex.Store({
        state: initialTenantState(),
        getters: tenant.getters,
        mutations: tenant.mutations
      })
      expect(store.getters.tenantIsSet).toBe(false)
    })
  })
  describe('getters with logged in tenant state', () => {
    let store
    beforeEach(() => {
      store = new Vuex.Store({
        state: loggedinTenantState(),
        getters: tenant.getters,
        actions: tenant.actions,
        mutations: tenant.mutations
      })
    })
    it('should return logged in tenant details when tenant getter is called on loggedInTenantState', () => {
      expect(store.getters.tenant).toEqual(loggedinTenantState().tenant)
    })
    it('should return if tenant is set as boolean when tenantIsSet getter is called', () => {
      expect(store.getters.tenantIsSet).toBe(true)
    })
    it('should return the defaultTenant when the defaultTenant getter is called', () => {
      expect(store.getters.defaultTenant.slug).toEqual('test')
      expect(store.getters.defaultTenant).toEqual(
        loggedinTenantState().defaultTenant
      )
    })
    it('should return the role when the role getter is called', () => {
      expect(store.getters.role).toEqual('TENANT_ADMIN')
    })
    it('should return an array of tenant objects when the tenants getter is called', () => {
      expect(store.getters.tenants[0].slug).toEqual('test')
      expect(store.getters.tenants).toEqual(loggedinTenantState().tenants)
    })
  })

  describe('Mutations', () => {
    let store

    beforeEach(() => {
      store = new Vuex.Store({
        state: initialTenantState(),
        getters: tenant.getters,
        actions: tenant.actions,
        mutations: tenant.mutations
      })
    })
    describe('setTenant', () => {
      it('should set tenantIsSet to true', () => {
        store.commit('setTenant', loggedinTenantState().tenant)
        expect(store.getters['tenantIsSet']).toBe(true)
        expect(store.getters['tenant']).toEqual(loggedinTenantState().tenant)
      })
      it('should throw an error if given no tenant', () => {
        store.commit('unsetTenant')
        expect(() => store.commit('setTenant')).toThrow(
          'passed invalid or empty tenant object'
        )
      })
    })
    describe('unsetTenant', () => {
      it('should set tenantIsSet to false', () => {
        //Make sure store is in logged in state
        store.commit('setTenant', loggedinTenantState().tenant)
        expect(store.getters['tenant']).toEqual(loggedinTenantState().tenant)
        store.commit('unsetTenant')
        expect(store.getters['tenantIsSet']).toBe(false)
        expect(store.getters['tenant']).toEqual(initialTenantState().tenant)
      })
    })
    describe('updateTenantSettings', () => {
      it('should update the settings in the store and leave the rest of the tenant as is', () => {
        //Make sure store is in logged in state
        store.commit('setTenant', loggedinTenantState().tenant)
        expect(store.getters['tenant']).toEqual(loggedinTenantState().tenant)
        expect(store.getters['tenantIsSet']).toEqual(
          loggedinTenantState().tenantIsSet
        )
        store.commit('updateTenantSettings', { agreedToLicense: true })
        expect(store.getters['tenant']).toEqual({
          ...loggedinTenantState().tenant,
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
