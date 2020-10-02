import user from '@/store/user'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

jest.mock('@/middleware/prefectAuth', () => {
  null
})

jest.mock('@/middleware/prefectAuth', () => {
  return {
    prefectUser: jest.fn()
  }
})
import { prefectUser } from '@/middleware/prefectAuth'

describe('user Vuex Module', () => {
  const initialState = () => {
    return {
      user: {
        id: null,
        email: null,
        username: null,
        default_membership_id: null,
        memberships: null,
        first_name: '',
        last_name: '',
        settings: {
          timezone: ''
        }
      },
      auth0User: {
        name: null,
        email: null,
        picture: null
      },
      userIsSet: false
    }
  }

  const userState = () => {
    return {
      user: {
        id: '12345',
        email: 'test@test.com',
        username: 'test123',
        default_membership_id: '5678',
        memberships: [
          {
            id: '1112131415',
            role: 'USER',
            tenant: { id: 'yyyyy', name: 'test2', slug: 'test2' }
          },
          {
            id: '5678',
            role: 'TENANT_ADMIN',
            tenant: { id: 'xxx', name: 'test1', slug: 'test1' }
          }
        ],
        first_name: 'first',
        last_name: 'last',
        settings: {
          timezone: 'utc'
        }
      },
      auth0User: {
        name: 'testtest',
        email: 'test@test.com',
        picture: 'linktopicture'
      },
      userIsSet: true
    }
  }

  describe('State', () => {
    test('userIsSet should initally be set to false', () => {
      const state = user.state
      expect(state.userIsSet).toBe(false)
    })
    test('user details should initally be empty', () => {
      const state = user.state
      expect(state.user).toEqual({
        id: null,
        email: null,
        username: null,
        default_membership_id: null,
        memberships: null,
        first_name: '',
        last_name: '',
        settings: {
          timezone: ''
        }
      })
    })
    test('auth0User details should initally be empty', () => {
      const state = user.state
      expect(state.auth0User).toEqual({
        name: null,
        email: null,
        picture: null
      })
    })
  })

  describe('getters', () => {
    let store
    store = new Vuex.Store({
      state: userState(),
      getters: user.getters,
      mutations: user.mutations
    })
    test('user should return user details', () => {
      expect(store.getters.user).toBe(store.state.user)
    })
    test('userIsSet should initially return false', () => {
      expect(store.getters.userIsSet).toBe(true)
    })
    test('defaultMembershipId should return membership id if user membership id is set', () => {
      expect(store.getters.defaultMembershipId).toEqual('5678')
    })
    test('auth0user should return auth0user details', () => {
      expect(store.getters.auth0User).toEqual({
        name: 'testtest',
        email: 'test@test.com',
        picture: 'linktopicture'
      })
    })
    test('timezone should return user timezone', () => {
      expect(store.getters.timezone).toEqual('utc')
    })
    test('settings should return user settings', () => {
      expect(store.getters.settings).toEqual({
        timezone: 'utc'
      })
    })
    test('firstName should return user first name', () => {
      expect(store.getters.firstName).toEqual('first')
    })
    test('lastName should return user last name', () => {
      expect(store.getters.lastName).toEqual('last')
    })
    test('memberships should return memberships array', () => {
      expect(store.getters.memberships).toEqual(userState().user.memberships)
    })
  })

  describe('mutations', () => {
    let store
    beforeEach(() => {
      store = new Vuex.Store({
        state: initialState(),
        getters: user.getters,
        mutations: user.mutations
      })
    })

    test('user mutation sets the user and updates user is set', () => {
      expect(store.getters.user).toEqual(initialState().user)
      expect(store.getters.userIsSet).toBe(false)
      store.commit('user', userState().user)
      expect(store.getters.user).toEqual(userState().user)
      expect(store.getters.user.email).toEqual('test@test.com')
      expect(store.getters.userIsSet).toBe(true)
    })
    test('setAuth0User mutation sets the auth0 user', () => {
      expect(store.getters.auth0User).toEqual(initialState().auth0User)
      store.commit('setAuth0User', userState().auth0User)
      expect(store.getters.auth0User).toEqual(userState().auth0User)
      expect(store.getters.auth0User.email).toEqual('test@test.com')
    })
    test('setUsetSettings mutation sets the user settings', () => {
      expect(store.getters.user).toEqual(initialState().user)
      store.commit('setUserSettings', userState().user.settings)
      expect(store.getters.settings).toEqual(userState().user.settings)
      expect(store.getters.timezone).toEqual('utc')
    })
    test('unsetUser mutation un-sets the user and updates user is set', () => {
      store.commit('user', userState().user)
      expect(store.getters.user).toEqual(userState().user)
      expect(store.getters.user.email).toEqual('test@test.com')
      expect(store.getters.userIsSet).toBe(true)
      store.commit('unsetUser')
      expect(store.getters.user).toEqual(initialState().user)
      expect(store.getters.userIsSet).toBe(false)
    })
    test('unsetAuth0User mutation un-sets the auth0 user', () => {
      store.commit('setAuth0User', userState().auth0User)
      expect(store.getters.auth0User).toEqual(userState().auth0User)
      expect(store.getters.auth0User.email).toEqual('test@test.com')
      store.commit('unsetAuth0User')
      expect(store.getters.auth0User).toEqual(initialState().auth0User)
      expect(store.getters.auth0User.email).toEqual(null)
    })
    test('setUserDefaultMembershipId mutation sets the default membership', () => {
      expect(store.getters.defaultMembershipId).toEqual(null)
      store.commit('setUserDefaultMembershipId', '5678')
      expect(store.getters.defaultMembershipId).toEqual('5678')
    })
  })

  describe('actions', () => {
    describe('setDefaultTenant action', () => {
      let store
      beforeEach(() => {
        // Mock the mutations and actions from other stores
        // that we don't want to
        // test here
        user.mutations['tenant/setDefaultTenant'] = jest.fn()
        store = new Vuex.Store({
          state: userState(),
          getters: {
            ...user.getters,
            'tenant/tenants': () => [
              { id: '3333', name: 'test33', slug: 'test33' }
            ]
          },
          mutations: user.mutations,
          actions: user.actions
        })
      })
      it('sets the default tenant according to the default membership id if available', () => {
        expect(store.getters.defaultMembershipId).toEqual('5678')
        store.dispatch('setDefaultTenant')
        expect(
          //First argument passed is the user state object, second is the default tenant to set
          user.mutations['tenant/setDefaultTenant'].mock.calls[0][1]
        ).toEqual({
          id: 'xxx',
          name: 'test1',
          slug: 'test1'
        })
      })
      it('sets the default tenant according to the first tenant in the memberships array if there is no tenant matching the default membership id', async () => {
        expect(store.getters.defaultMembershipId).toEqual('5678')
        store.commit('setUserDefaultMembershipId', '2222')
        expect(store.getters.defaultMembershipId).toEqual('2222')
        await store.dispatch('setDefaultTenant')
        expect(
          //First argument passed is the user state, second is the default tenant to set
          user.mutations['tenant/setDefaultTenant'].mock.calls[0][1]
        ).toEqual({ id: 'yyyyy', name: 'test2', slug: 'test2' })
      })
      it('sets the default tenant according to the first tenant in the tenants store tenants array if there are no memberships', async () => {
        store.commit('unsetUser')
        expect(store.getters.memberships).toEqual(null)
        await store.dispatch('setDefaultTenant')
        expect(
          //First argument passed is the user state, second is the default tenant to set
          user.mutations['tenant/setDefaultTenant'].mock.calls[0][1]
        ).toEqual({ id: '3333', name: 'test33', slug: 'test33' })
      })
    })

    describe('getUser action', () => {
      let store
      beforeEach(() => {
        // Mock the mutations and actions from other stores
        // that we don't want to
        // test here
        user.mutations['tenant/setDefaultTenant'] = jest.fn()
        store = new Vuex.Store({
          state: initialState(),
          getters: user.getters,
          mutations: user.mutations,
          actions: user.actions
        })
      })
      it('calls prefectUser', async () => {
        await store.dispatch('getUser')
        expect(prefectUser).toBeCalled()
      })
      it('set the user', async () => {
        expect(store.getters.user).toEqual(initialState().user)
        prefectUser.mockReturnValueOnce(userState().user)
        await store.dispatch('getUser')
        expect(store.getters.user).toEqual(userState().user)
      })
      it('calls setDefaultTenant', async () => {
        await store.dispatch('getUser')
        expect(user.mutations['tenant/setDefaultTenant']).toBeCalled()
      })
      it('returns the user', async () => {
        prefectUser.mockReturnValueOnce(userState().user)
        const returnedUser = await store.dispatch('getUser')
        expect(returnedUser).toEqual(userState().user)
      })
    })
  })
})
