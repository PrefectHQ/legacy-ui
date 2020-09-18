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
  })
  describe('getters', () => {
    let store
    store = new Vuex.Store({
      state: initialState(),
      getters: user.getters,
      mutations: user.mutations
    })

    it('user should return empty user in initialState', () => {
      expect(store.getters.user).toBe(store.state.user)
    })
    it('userIsSet should initially return false', () => {
      expect(store.getters.userIsSet).toBe(false)
    })
    it('defaultMembershipId should initially return null', () => {
      expect(store.getters.defaultMembershipId).toBe(null)
    })
  })

  describe('mutations', () => {
    let store
    store = new Vuex.Store({
      state: initialState(),
      getters: user.getters,
      mutations: user.mutations
    })
    it('changes "timezone" value when "updateUserSettings" is commited', () => {
      expect(store.getters.timezone).toBe('')
      store.commit('setUserSettings', { timezone: 'UTC' })
      expect(store.getters.timezone).toBe('UTC')
    })
  })
})
