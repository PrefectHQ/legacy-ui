import { fallbackApolloClient } from '@/vue-apollo'
import LogRocket from 'logrocket'

const state = {
  license: null,
  permissions: null
}

const getters = {
  hasLicense(state) {
    return !!state.license
  },
  license(state) {
    return state.license
  },
  permissions(state) {
    return state.permissions
  }
}

const mutations = {
  setLicense(state, license) {
    state.license = license
  },
  unsetLicense(state) {
    state.license = null
  },
  setPermissions(state, permissions) {
    state.permissions = permissions
  },
  unsetPermissions(state) {
    state.permissions = null
  }
}

const actions = {
  async getLicense({ commit }) {
    commit('unsetLicense')
    commit('unsetPermissions')
    try {
      const { data } = await fallbackApolloClient.query({
        query: require('@/graphql/License/license.gql'),
        fetchPolicy: 'no-cache'
      })
      if (data?.auth_info?.license) {
        commit('setLicense', data.auth_info.license)
      }

      if (data?.auth_info?.permissions) {
        commit('setPermissions', data.auth_info.permissions)
      } else {
        throw new Error('no auth info on this license')
      }
    } catch (error) {
      LogRocket.captureException(error.toString(), {
        extra: {
          pageName: 'LicenseStore',
          stage: 'getLicense'
        }
      })
    }
  }
}

export default {
  getters,
  mutations,
  state,
  actions,
  namespaced: true
}
