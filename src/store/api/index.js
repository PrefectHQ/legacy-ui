import { defaultOptions } from '@/vue-apollo'
import { createApolloClient } from 'vue-cli-plugin-apollo/graphql-client'
import LogRocket from 'logrocket'

const state = {
  backend: process.env.VUE_APP_BACKEND || 'CLOUD',
  connected: true,
  releaseTimestamp: null,
  cloudUrl: process.env.VUE_APP_CLOUD_URL,
  serverUrl:
    localStorage.getItem('server_url') || process.env.VUE_APP_SERVER_URL,
  version: null
}

const getters = {
  backend(state) {
    return state.backend
  },
  connected(state) {
    return state.connected
  },
  isCloud(state) {
    return state.backend === 'CLOUD'
  },
  isServer(state) {
    return state.backend === 'SERVER'
  },
  releaseTimestamp(state) {
    return state.releaseTimestamp
  },
  cloudUrl(state) {
    return state.cloudUrl
  },
  serverUrl(state) {
    return state.serverUrl
  },
  url(state) {
    switch (state.backend) {
      case 'CLOUD':
        return state.cloudUrl
      case 'SERVER':
        return state.serverUrl
      default:
        return null
    }
  },
  version(state) {
    return state.version
  }
}

const mutations = {
  setBackend(state, backend) {
    state.backend = backend
  },
  unsetBackend(state) {
    state.backend = null
  },
  setConnected(state, connected) {
    state.connected = connected
  },
  setReleaseTimestamp(state, timestamp) {
    state.releaseTimestamp = timestamp
  },
  unsetReleaseTimetamp(state) {
    state.releaseTimestamp = null
  },
  setServerUrl(state, url) {
    localStorage.setItem('server_url', url)
    state.url = url
  },
  unsetServerUrl(state) {
    localStorage.removeItem('server_url')
    state.url = null
  },
  setVersion(state, version) {
    state.version = version
  },
  unsetVersion(state) {
    state.version = null
  }
}

const actions = {
  async getApi({ commit }, source) {
    console.log('getting api', source)
    const apolloClient = createApolloClient({ ...defaultOptions }).apolloClient
    try {
      const { data } = await apolloClient.query({
        query: require('@/graphql/api.gql'),
        fetchPolicy: 'no-cache'
      })

      commit('setReleaseTimestamp', data.api.release_timestamp)
      commit('setVersion', data.api.version)
      commit('setConnected', true)
    } catch (error) {
      commit('unsetReleaseTimetamp')
      commit('unsetVersion')
      commit('setConnected', false)

      LogRocket.captureException(error, {
        extra: {
          pageName: 'API Store',
          stage: 'getApi'
        }
      })
    }
  },
  async setServerUrl({ commit }, url) {
    commit('setServerUrl', url)
  },
  async switchBackend({ rootGetters, commit, dispatch }, backend) {
    commit('setBackend', backend)

    if (backend == 'CLOUD') {
      await dispatch('getApi', 'CLOUD')
      await dispatch('auth0/authenticate', null, { root: true })
      await dispatch('auth0/authorize', null, { root: true })
      await dispatch('user/getUser', null, { root: true })
      await dispatch(
        'tenant/getTenant',
        rootGetters['user/defaultMembershipId'],
        {
          root: true
        }
      )
    } else if (backend == 'SERVER') {
      try {
        await dispatch('tenant/getTenants', null, { root: true })
        await dispatch('tenant/getServerTenant', null, { root: true })
      } catch {
        commit('tenant/unsetTenants', null, { root: true })
        commit('tenant/unsetTenant', null, { root: true })
      }
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
