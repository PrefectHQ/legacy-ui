jest.mock('@/auth/index.js')

import tenant from '@/store/tenant'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

jest.mock('@/middleware/prefectAuth', () => {
  return {
    prefectTenants: jest.fn(),
    prefectRefresh: jest.fn()
  }
})
import { prefectTenants } from '@/middleware/prefectAuth'

jest.mock(
  '@/graphql/Tenant/tenant-token.gql',
  () => 'tenant token mutation string'
)

const mockUpdate = jest.fn()

jest.mock('@/vue-apollo', () => {
  return {
    fallbackApolloClient: {
      mutate: settings => {
        mockUpdate(settings.variables.settings)
        return { data: { tenant: 1 } }
      }
    }
  }
})

jest.mock(
  '@/graphql/Tenant/membership.gql',
  () => 'tenant membership query string'
)
jest.mock('@/graphql/Mutations/update-tenant-settings.gql', () => 'gql string')

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
        stripe_customer: null
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
        { name: 'TestTenant2', slug: 'testy', id: 'YYYYYYYYY' },
        {
          id: 'd38b31a7-d570-4f0c-911d-dcaab5cec3d0',
          name: 'Test Technologies Inc.',
          info: null,
          slug: 'test',
          role: 'TENANT_ADMIN',
          settings: { teamNamed: true, agreedToLicense: false },
          prefectAdminSettings: {},
          licenses: [{ active: true, product: 'Prefect Cloud Platform' }]
        }
      ]
    }
  }

  describe('State', () => {
    it('should hold tenant info)', () => {
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

  describe('getters', () => {
    let store
    beforeEach(() => {
      store = new Vuex.Store({
        state: loggedinTenantState(),
        getters: tenant.getters,
        actions: tenant.actions,
        mutations: tenant.mutations
      })
    })
    test('tenant getter should return logged in tenant details', () => {
      expect(store.getters.tenant).toEqual(loggedinTenantState().tenant)
    })
    test('tenantIsSet getter should return true if the tenant is set', () => {
      expect(store.getters.tenantIsSet).toBe(true)
    })
    test('defaultTenant getter should return the defaultTenant', () => {
      expect(store.getters.defaultTenant.slug).toEqual('test')
      expect(store.getters.defaultTenant).toEqual(
        loggedinTenantState().defaultTenant
      )
    })
    test('role getter should return the role', () => {
      expect(store.getters.role).toEqual('TENANT_ADMIN')
    })
    test('tenants getter should return an array of tenant objects', () => {
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

    describe('setDefaultTenant', () => {
      it('should set the defaultTenant', () => {
        const tenant = loggedinTenantState().tenant
        store.commit('setDefaultTenant', tenant)
        expect(store.getters['defaultTenant']).toEqual(
          loggedinTenantState().tenant
        )
      })
      it('should throw an error if passed an invalid tenant', () => {
        expect(() => store.commit('setDefaultTenant', [1, 2, 3])).toThrow(
          'passed invalid or empty tenant object'
        )
      })

      it('should throw an error if passed no tenant', () => {
        expect(() => store.commit('setDefaultTenant')).toThrow(
          'passed invalid or empty tenant object'
        )
      })

      it('should throw an error if passed an empty tenant', () => {
        expect(() => store.commit('setDefaultTenant', {})).toThrow(
          'passed invalid or empty tenant object'
        )
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

      it('should throw an error if given an empty tenant', () => {
        store.commit('unsetTenant')
        expect(() => store.commit('setTenant', {})).toThrow(
          'passed invalid or empty tenant object'
        )
      })
    })

    describe('setTenants', () => {
      it('should set the tenants array', () => {
        const tenants = loggedinTenantState().tenants
        store.commit('setTenants', tenants)
        expect(store.getters['tenants'][0]).toEqual(tenants[0])
      })

      it('should throw an error if given no tenants array', () => {
        store.commit('unsetTenants')
        expect(() => store.commit('setTenants')).toThrow(
          'passed invalid or empty tenant array'
        )
      })

      it('should throw an error if given an empty tenants array', () => {
        store.commit('unsetTenants')
        expect(() => store.commit('setTenants', [])).toThrow(
          'passed invalid or empty tenant array'
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

    describe('unsetTenants', () => {
      it('should set tenants to an empty array', () => {
        //Make sure store is in logged in state
        store.commit('setTenants', loggedinTenantState().tenants)
        expect(store.getters['tenants']).toEqual(loggedinTenantState().tenants)
        store.commit('unsetTenants')
        expect(store.getters['tenants']).toEqual([])
      })
    })

    describe('updateTenantSettings', () => {
      it('should update the settings in the store and leave the rest of the tenant as is', () => {
        //Make sure store is in logged in state
        store.commit('setTenant', loggedinTenantState().tenant)
        expect(store.getters['tenant']).toEqual(loggedinTenantState().tenant)
        expect(store.getters['tenant'].settings.agreedToLicense).toEqual(false)
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

  describe('actions', () => {
    describe('getTenants - no query error', () => {
      let store

      beforeEach(() => {
        store = new Vuex.Store({
          state: initialTenantState(),
          getters: tenant.getters,
          mutations: tenant.mutations,
          actions: tenant.actions
        })
      })

      it('should call the prefectTenants method', async () => {
        await store.dispatch('getTenants')
        expect(prefectTenants).toHaveBeenCalled()
      })

      it('should set tenants', async () => {
        const tenantsArray = [{ name: 'boo', id: '12345' }]
        prefectTenants.mockReturnValueOnce(tenantsArray)
        await store.dispatch('getTenants')
        expect(store.getters.tenants).toEqual(tenantsArray)
      })

      it('should return tenants', async () => {
        const tenantsArray = [{ name: 'boo', id: '12345' }]
        prefectTenants.mockReturnValueOnce(tenantsArray)
        const returnedTenants = await store.dispatch('getTenants')
        expect(returnedTenants).toEqual([{ name: 'boo', id: '12345' }])
      })
    })

    describe('setCurrentTenant - Server', () => {
      let store

      beforeEach(() => {
        store = new Vuex.Store({
          state: initialTenantState(),
          getters: tenant.getters,
          mutations: tenant.mutations,
          actions: tenant.actions
        })
      })

      it('should throw an error if no slug is provided', () => {
        expect(store.dispatch('setCurrentTenant', false)).rejects.toThrow(
          'No slug was provided when trying to set the current tenant'
        )
      })

      it('should call getTenants if the passed tenant is not present in the store', async () => {
        expect(store.getters.tenant.slug).toBe(null)
        expect(store.getters.tenant.name).toBe(null)
        expect(store.getters.tenant.id).toBe(null)
        const tenantsArray = [
          { name: 'boo', id: '12345', slug: 'team2' },
          { name: 'anotherTenant', id: '45678' }
        ]
        prefectTenants.mockReturnValueOnce(tenantsArray)
        await store.dispatch('setCurrentTenant', 'team2')
        expect(store.getters.tenant.slug).toEqual('team2')
        expect(store.getters.tenant.name).toEqual('boo')
        expect(store.getters.tenant.id).toEqual('12345')
      })

      it('should throw an error if the requested tenant does not exist', async () => {
        expect(store.getters.tenant.slug).toBe(null)
        const tenantsArray = [{ name: 'boo', id: '12345', slug: 'team2' }]
        prefectTenants.mockReturnValueOnce(tenantsArray)
        expect(store.dispatch('setCurrentTenant', 'team3')).rejects.toThrow(
          "Error: Unable to set current tenant: tenant doesn't exist"
        )
      })

      it('should set the tenant role to TENANT_ADMIN', async () => {
        //All tenants need an admin - for tenants in server with only one member, that member's role should be admin
        expect(store.getters.tenant.slug).toBe(null)
        const tenantsArray = [{ name: 'boo', id: '12345', slug: 'team2' }]
        prefectTenants.mockReturnValueOnce(tenantsArray)
        await store.dispatch('setCurrentTenant', 'team2')
        expect(store.getters.role).toEqual('TENANT_ADMIN')
      })

      it('should return the tenant', async () => {
        const tenantsArray = [{ name: 'boo', id: '12345', slug: 'team2' }]
        prefectTenants.mockReturnValueOnce(tenantsArray)
        expect(await store.dispatch('setCurrentTenant', 'team2')).toEqual({
          id: '12345',
          name: 'boo',
          role: 'TENANT_ADMIN',
          slug: 'team2'
        })
      })
    })

    describe('setCurrentTenant - Cloud', () => {
      let store

      beforeEach(() => {
        tenant.actions['auth/updateAuthorization'] = jest.fn()
        tenant.actions['license/getLicense'] = jest.fn()
        store = new Vuex.Store({
          state: initialTenantState(),
          getters: {
            ...tenant.getters,
            'api/isCloud': () => true,
            'user/memberships': () => [
              { tenant: { id: '12345' }, role_detail: { name: 'USER' } },
              {
                tenant: { id: '45678' },
                role_detail: { name: 'TENANT_ADMIN' }
              },
              {
                tenant: { id: '9101112' },
                role_detail: { name: 'READ_ONLY_USER' }
              }
            ]
          },
          mutations: tenant.mutations,
          actions: tenant.actions
        })
      })

      it('should set the tenant role according to user memberships - USER role', async () => {
        expect(store.getters.tenant.slug).toBe(null)
        const tenantsArray = [
          { name: 'boo', id: '12345', slug: 'team2' },
          { name: 'anotherTeam', id: '45678', slug: 'team3' }
        ]
        prefectTenants.mockReturnValueOnce(tenantsArray)
        await store.dispatch('setCurrentTenant', 'team2')
        expect(store.getters.role).toEqual('USER')
      })

      it('should set the tenant role according to user memberships - TENANT_ADMIN role', async () => {
        expect(store.getters.tenant.slug).toBe(null)
        const tenantsArray = [
          { name: 'boo', id: '12345', slug: 'team2' },
          { name: 'anotherTeam', id: '45678', slug: 'team3' },
          { name: 'aReadOnlyTeam', id: '9101112', slug: 'team1' }
        ]
        prefectTenants.mockReturnValueOnce(tenantsArray)
        await store.dispatch('setCurrentTenant', 'team1')

        expect(store.getters.role).toEqual('READ_ONLY_USER')
      })
    })

    describe('updateTenantSettings', () => {
      let store

      beforeEach(() => {
        tenant.actions.getTenants = jest.fn()
        store = new Vuex.Store({
          state: initialTenantState(),
          getters: tenant.getters,
          mutations: tenant.mutations,
          actions: tenant.actions
        })
      })

      it('should throw an error if no settings are given', async () => {
        expect(store.dispatch('updateTenantSettings')).rejects.toThrow(
          'Error: passed invalid or empty settings object'
        )
      })

      it('should call the getTenants action when settings are given', async () => {
        await store.dispatch('updateTenantSettings', { name: 'Tom' })
        expect(tenant.actions.getTenants).toBeCalled()
      })

      it('should call the update tenant settings mutation when settings are given', async () => {
        await store.dispatch('updateTenantSettings', { name: 'Tom' })
        expect(mockUpdate).toBeCalledWith({ name: 'Tom' })
      })
    })
  })
})
