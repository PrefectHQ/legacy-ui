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
  flowConcurrency(state) {
    return state.license?.terms?.flow_concurrency
  },
  isSelfServe(state) {
    return (
      state.license?.terms?.plan === 'SELF_SERVE' ||
      state.license?.terms?.is_self_serve
    )
  },
  isUsageBased(state) {
    return state.license?.terms?.is_usage_based
  },
  hasRBAC(state) {
    return state.permissions?.includes('feature:basic-rbac')
  },
  // Determine if user has the proper permissions to access TCLs
  // - They are on a license that grants explicit permission to access this feature
  isEligible(state) {
    // If permissions are still loading...
    if (!state.permissions) return true

    return state.permissions.includes('feature:concurrency-limit')
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
