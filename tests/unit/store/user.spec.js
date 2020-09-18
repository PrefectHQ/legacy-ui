import user from '@/store/user'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

jest.mock('@/middleware/prefectAuth', () => {
  null
})

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
            id: '5678',
            role: 'TENANT_ADMIN',
            tenant: { id: 'xxx', name: 'test1', slug: 'test1' }
          },
          {
            id: '1112131415',
            role: 'USER',
            tenant: { id: 'yyyyy', name: 'test2', slug: 'test2' }
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
    test('first name should return user first name', () => {
      expect(store.getters.firstName).toEqual('first')
    })
    test('last name should return user last name', () => {
      expect(store.getters.lastName).toEqual('last')
    })
  })

  describe('mutations', () => {
    let store
    store = new Vuex.Store({
      state: initialState(),
      getters: user.getters,
      mutations: user.mutations
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
  })
})
