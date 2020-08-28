import license from '@/store/license'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

jest.mock('@/graphql/License/license.gql', () => 'tenant token query string')

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
      it('should return the license when the license getter is called', () => {
        expect(store.getters.license).toBe(null)
      })

      it('should return false if there is no license when the hasLicense getter is called', () => {
        expect(store.getters.hasLicense).toBe(false)
      })

      it('should return permissions when the permissions getter is called', () => {
        expect(store.getters.permissions).toBe(null)
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
    describe('getLicense', () => {
      it('should set new license data', () => {
        expect().toEqual()
      })
    })
  })
})
