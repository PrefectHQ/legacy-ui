import { fallbackApolloClient } from '@/vue-apollo'
import LogRocket from 'logrocket'

const state = {
  license: null,
  permissions: null,
  tempLicenseType: null
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
  },
  tempLicenseType(state) {
    return state.tempLicenseType
  },
  planType: state => type => {
    if (type) {
      return state.license?.terms?.plan.includes(type)
    }
    return state.license?.terms?.plan
  },
  hasPermission: state => (operation, ref) => {
    return state.permissions?.includes(`${operation}:${ref}`)
  },
  allowedUsers: state => type => {
    if (type === 'read') {
      return state.license?.terms?.read_only_users
    }
    return state.license?.terms?.users
  }
}

const mutations = {
  setLicense(state, license) {
    state.license = license
    state.tempLicenseType = null
  },
  setTempLicenseType(state, type) {
    state.tempLicenseType = type
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
      }
    } catch (error) {
      commit('unsetLicense')
      commit('unsetPermissions')
      // eslint-disable-next-line no-console
      console.log(error)
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
