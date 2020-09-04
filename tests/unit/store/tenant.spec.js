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

let mockerror

jest.mock('@/vue-apollo', () => {
  return {
    fallbackApolloClient: {
      query: () => {
        if (!mockerror) {
          return {
            data: {
              auth_info: {
                license: {},
                permissions: {}
              }
            }
          }
        } else {
          return 'error'
        }
      }
    }
  }
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

    describe('setTenants', () => {
      it('should set the tenants array', () => {
        const tenants = loggedinTenantState().tenants
        store.commit('setTenants', tenants)
        expect(store.getters['tenants'][0]).toEqual(tenants[0])
      })

      it('should throw an error if given no tenants', () => {
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
        mockerror = false
        store = new Vuex.Store({
          state: initialTenantState(),
          getters: tenant.getters,
          mutations: tenant.mutations,
          actions: tenant.actions
        })
      })

      it('should set tenants', async () => {
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
        const tenantsArray = [
          { name: 'boo', id: '12345' },
          { name: 'team2', id: '345' }
        ]
        prefectTenants.mockReturnValueOnce(tenantsArray)
        const returnedTenants = await store.dispatch('getTenants')
        expect(returnedTenants).toEqual([
          { name: 'boo', id: '12345' },
          { name: 'tea2', id: '345' }
        ])
      })
    })

    // describe('getLicense - with query error', () => {
    //   let store

    //   beforeEach(() => {
    //     mockerror = true
    //     store = new Vuex.Store({
    //       state: initialLicenseState(),
    //       getters: license.getters,
    //       mutations: license.mutations,
    //       actions: license.actions
    //     })
    //   })

    //   it('should not set license data', async () => {
    //     await store.dispatch('getLicense')
    //     expect(store.getters.hasLicense).toBe(false)
    //     expect(store.getters.license).toEqual(null)
    //   })
    //   it('should not set permissions', async () => {
    //     await store.dispatch('getLicense')
    //     expect(store.getters.permissions).toEqual(null)
    //   })
    //   // it('should call logRocket', async () => {
    //   //   await store.dispatch('getLicense')
    //   //   expect(LogRocket.captureException).toHaveBeenCalled()
    //   // })
    // })
  })
})
