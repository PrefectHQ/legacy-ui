process.env.VUE_APP_BACKEND = 'CLOUD'

import license from '@/store/license'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

//simple mock for gql query
let mockerror = false

jest.mock('logrocket', () => {
  return {
    captureException: jest.fn()
  }
})

jest.mock('@/graphql/License/license.gql', () => 'license query string')

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

const localVue = createLocalVue()
localVue.use(Vuex)

describe('license Vuex Module', () => {
  const initialLicenseState = () => {
    return {
      license: null,
      permissions: null
    }
  }

  const activePermissions = () => {
    return ['read:flow', 'read:project']
  }

  const activeLicense = () => {
    return {
      id: 'bar',
      key: 'foo',
      active: true,
      terms: {
        plan: 'SELF_SERVE',
        users: 1,
        history_retention_days: 30,
        flow_concurrency: 1,
        permissions: ['tier:scheduler', 'plan:self-serve']
      }
    }
  }

  describe('License State', () => {
    it('should initally be unset', () => {
      const state = license.state
      expect(state.license).toBe(null)
    })
  })

  describe('Permissions State', () => {
    it('should initially be unset', () => {
      const state = license.state
      expect(state.permissions).toBe(null)
    })
  })

  describe('getters', () => {
    describe('when no license is set', () => {
      let store
      store = new Vuex.Store({
        state: initialLicenseState(),
        getters: license.getters,
        mutations: license.mutations
      })
      it('should return null when the license getter is called', () => {
        expect(store.getters.license).toBe(null)
      })

      it('should return false if there is no license when the hasLicense getter is called', () => {
        expect(store.getters.hasLicense).toBe(false)
      })

      it('should return null when the permissions getter is called', () => {
        expect(store.getters.permissions).toBe(null)
      })

      it('should return undefined when the planType getter is called with no parameters', () => {
        expect(store.getters.planType()).toBe(undefined)
      })

      it('should return undefined when the planType getter is called with parameters', () => {
        expect(store.getters.planType('STARTER')).toBe(undefined)
      })

      it('should return undefined when the hasPermission getter is called with  no parameters', () => {
        expect(store.getters.hasPermission()).toBe(undefined)
      })

      it('should return undefined when the hasPermission getter is called with parameters', () => {
        expect(store.getters.hasPermission('read', 'flow')).toBe(undefined)
      })
    })

    describe('when licenses are set', () => {
      // testing this works in both types of state
      let store
      store = new Vuex.Store({
        state: { license: activeLicense(), permissions: activePermissions() },
        getters: license.getters,
        mutations: license.mutations
      })

      it('should return the license when the license getter is called', () => {
        expect(store.getters.license).toStrictEqual(activeLicense())
      })

      it('should return true if there is a license when the hasLicense getter is called', () => {
        expect(store.getters.hasLicense).toBe(true)
      })

      it('should return permissions when the permissions getter is called', () => {
        expect(store.getters.permissions).toStrictEqual(activePermissions())
      })

      it('should return the current planType when the planType getter is called with no parameters', () => {
        expect(store.getters.planType()).toBe('SELF_SERVE')
      })
      it('should return true if the planType is equal to the parameter', () => {
        expect(store.getters.planType('SELF_SERVE')).toBe(true)
      })

      it('should return false when the hasPermission getter is called with no parameters', () => {
        expect(store.getters.hasPermission()).toBe(false)
      })

      it('should return true when the hasPermission getter is called with parameters', () => {
        expect(store.getters.hasPermission('read', 'flow')).toBe(true)
      })
    })
  })

  describe('Mutations', () => {
    let store

    beforeEach(() => {
      store = new Vuex.Store({
        state: initialLicenseState(),
        getters: license.getters,
        mutations: license.mutations
      })
    })

    describe('setLicense', () => {
      it('should set the license', () => {
        expect(store.getters.hasLicense).toBe(false)

        store.commit('setLicense', activeLicense())

        expect(store.getters.hasLicense).toBe(true)
        expect(store.getters.license).toStrictEqual(activeLicense())
      })
    })

    describe('unsetLicense', () => {
      it('should remove the current license', () => {
        store.commit('setLicense', activeLicense())

        expect(store.getters.hasLicense).toBe(true)

        store.commit('unsetLicense')

        expect(store.getters.hasLicense).toBe(false)
        expect(store.getters.license).toEqual(initialLicenseState().license)
      })
    })

    describe('setPermissions', () => {
      it('should set permissions', () => {
        expect(store.state.permissions).toBe(null)

        store.commit('setPermissions', activePermissions())

        expect(store.state.permissions).toStrictEqual(activePermissions())
      })
    })

    describe('unsetPermissions', () => {
      it('should remove the current permissions', () => {
        store.commit('setPermissions', activePermissions())

        expect(store.getters.permissions).toStrictEqual(activePermissions())

        store.commit('unsetPermissions')
        expect(store.getters.permissions).toEqual(null)
      })
    })
  })

  describe('actions', () => {
    describe('getLicense - no query error', () => {
      let store

      beforeEach(() => {
        mockerror = false
        store = new Vuex.Store({
          state: initialLicenseState(),
          getters: license.getters,
          mutations: license.mutations,
          actions: license.actions
        })
      })
      it('should set new license data', async () => {
        await store.dispatch('getLicense')
        expect(store.getters.hasLicense).toBe(true)
        expect(store.getters.license).toEqual({})
      })
      it('should set permissions', async () => {
        await store.dispatch('getLicense')
        expect(store.getters.permissions).toEqual({})
      })
    })

    describe('getLicense - with query error', () => {
      let store

      beforeEach(() => {
        mockerror = true
        store = new Vuex.Store({
          state: initialLicenseState(),
          getters: license.getters,
          mutations: license.mutations,
          actions: license.actions
        })
      })

      it('should not set license data', async () => {
        await store.dispatch('getLicense')
        expect(store.getters.hasLicense).toBe(false)
        expect(store.getters.license).toEqual(null)
      })
      it('should not set permissions', async () => {
        await store.dispatch('getLicense')
        expect(store.getters.permissions).toEqual(null)
      })
      // it('should call logRocket', async () => {
      //   await store.dispatch('getLicense')
      //   expect(LogRocket.captureException).toHaveBeenCalled()
      // })
    })
  })
})
