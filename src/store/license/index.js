import { defaultOptions } from '@/vue-apollo'
import { createApolloClient } from 'vue-cli-plugin-apollo/graphql-client'
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

    const apolloClient = createApolloClient({ ...defaultOptions }).apolloClient
    try {
      const { data } = await apolloClient.query({
        query: require('@/graphql/License/license.gql'),
        fetchPolicy: 'no-cache'
      })
      if (data?.auth_info?.license) {
        commit('setLicense', data.auth_info.license)
      }

      if (data?.auth_info?.permissions) {
        commit('setPermissions', data.auth_info.permissions)
      }
    } catch (error) {
      LogRocket.captureException(error, {
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
