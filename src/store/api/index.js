/* eslint-disable */
import { defaultOptions } from '@/vue-apollo'
import { createApolloClient } from 'vue-cli-plugin-apollo/graphql-client'
import { prefectUser } from '@/middleware/prefectAuth'
import LogRocket from 'logrocket'

const state = {
  backend: null,
  connected: true,
  releaseTimestamp: null,
  url: localStorage.getItem('url') || process.env.VUE_APP_SERVER_URL,
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
    return state.backend == 'CLOUD'
  },
  isServer(state) {
    return state.backend == 'SERVER'
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
    return state.url
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
  setReleaseTimestamp(state, timestamp) {
    state.releaseTimestamp = timestamp
  },
  unsetReleaseTimetamp(state) {
    state.releaseTimestamp = null
  },
  setUrl(state, url) {
    localStorage.setItem('url', url)
    state.url = url
  },
  unsetUrl(state) {
    localStorage.removeItem('url')
    state.url = null
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
  async getApi({ commit }) {
    const apolloClient = createApolloClient({ ...defaultOptions }).apolloClient
    try {
      const { data } = await apolloClient.query({
        query: require('@/graphql/api.gql'),
        fetchPolicy: 'no-cache'
      })

      if (data?.api) {
        commit('setBackend', data.api.backend)
        commit('setReleaseTimestamp', data.api.release_timestamp)
        commit('setVersion', data.api.version)
      }
    } catch (error) {
      commit('unsetBackend')
      commit('unsetReleaseTimetamp')
      commit('unsetVersion')

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
  async switchBackend({ rootGetters, getters, commit, dispatch }, backend) {
    try {
      if (backend == 'CLOUD') {
        commit('setUrl', getters['cloudUrl'])

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
        commit('setUrl', getters['serverUrl'])

        await dispatch('tenant/getTenants', null, { root: true })
        await dispatch('tenant/getServerTenant', null, { root: true })
      }
    } catch (e) {
      commit('tenant/unsetTenant', null, { root: true })
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
