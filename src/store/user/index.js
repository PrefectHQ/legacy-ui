import { prefectUser } from '@/middleware/prefectAuth'

const state = {
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

const getters = {
  user(state) {
    return state.user
  },
  auth0User(state) {
    return state.auth0User
  },
  defaultMembershipId(state) {
    return state.user.default_membership_id
  },
  memberships(state) {
    return state.user.memberships
  },
  userIsSet(state) {
    return state.userIsSet
  },
  timezone(state) {
    return state.user.settings.timezone
  },
  settings(state) {
    return state.user.settings
  },
  firstName(state) {
    return state.user.first_name
  },
  lastName(state) {
    return state.user.last_name
  }
}

const mutations = {
  user(state, user) {
    state.user = { ...user }
    state.userIsSet = true
  },
  setAuth0User(state, auth0User) {
    state.auth0User = {
      name: auth0User.name,
      email: auth0User.email,
      picture: auth0User.picture
    }
  },
  setUserSettings(state, settings) {
    if (state.user.settings != settings) {
      state.user.settings = settings
    }
  },
  unsetUser(state) {
    state.user = {
      id: null,
      email: null,
      username: null,
      default_membership_id: null,
      memberships: null,
      settings: { timezone: '' }
    }
    state.userIsSet = false
  },
  unsetAuth0User(state) {
    state.auth0User = {
      name: null,
      email: null,
      picture: null
    }
  },
  setUserDefaultMembershipId(state, membershipId) {
    state.user.default_membership_id = membershipId
  }
}

const actions = {
  async getUser({ commit }) {
    const user = await prefectUser()
    commit('user', user)
  }
}

export default {
  getters,
  mutations,
  actions,
  state,
  namespaced: true
}
