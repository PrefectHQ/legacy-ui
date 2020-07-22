import { defaultOptions } from '@/vue-apollo'
import { createApolloClient } from 'vue-cli-plugin-apollo/graphql-client'
import LogRocket from 'logrocket'

const maxRetries = 3

const state = {
  backend: process.env.VUE_APP_BACKEND || 'CLOUD',
  connected: false,
  connectionMessage: null,
  connectionTimeout: null,
  releaseTimestamp: null,
  cloudUrl: process.env.VUE_APP_CLOUD_URL,
  retries: 0,
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
  connecting(state) {
    return !state.connected && state.retries < maxRetries
  },
  connectionMessage(state) {
    return state.connectionMessage
  },
  connectionTimeout(state) {
    return state.connectionTimeout
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
  retries(state) {
    return state.retries
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
  setConnectionMessage(state, message) {
    state.connectionMessage = message
  },
  unsetConnectionMessage(state) {
    state.connectionMessage = null
  },
  setConnectionTimeout(state, timeout) {
    state.connectionTimeout = timeout
  },
  unsetConnectionTimeout(state) {
    clearTimeout(state.connectionTimeout)
    state.connectionTimeout = null
  },
  setReleaseTimestamp(state, timestamp) {
    state.releaseTimestamp = timestamp
  },
  unsetReleaseTimetamp(state) {
    state.releaseTimestamp = null
  },
  setRetries(state, retries) {
    state.retries = retries
  },
  setServerUrl(state, url) {
    localStorage.setItem('server_url', url)
    state.serverUrl = url
  },
  unsetServerUrl(state) {
    localStorage.removeItem('server_url')
    state.serverUrl = null
  },
  setVersion(state, version) {
    state.version = version
  },
  unsetVersion(state) {
    state.version = null
  }
}

const actions = {
  async getApi({ commit, dispatch }) {
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

    dispatch('monitorConnection')
  },
  async monitorConnection({ getters, commit }) {
    commit('unsetConnectionTimeout')

    const monitorConnection = async () => {
      if (getters['retries'] >= maxRetries) {
        commit('setRetries', 0)
      }
      commit('setRetries', getters['retries'] + 1)

      try {
        const apolloClient = createApolloClient({ ...defaultOptions })
          .apolloClient
        const { data } = await apolloClient.query({
          query: require('@/graphql/api.gql'),
          fetchPolicy: 'network-only',
          errorPolicy: 'none'
        })
        if (data) {
          commit('setReleaseTimestamp', data.api.release_timestamp)
          commit('setVersion', data.api.version)
          commit('setConnectionMessage', 'Connected')
          commit('setRetries', 0)
          commit('setConnected', true)
        }
      } catch (e) {
        commit('setConnectionMessage', e)
        commit('setConnected', false)
      } finally {
        const timeout = setTimeout(
          monitorConnection,
          getters['retries'] >= maxRetries || getters['connected']
            ? 10000
            : 3000
        )
        commit('setConnectionTimeout', timeout)
      }
    }

    monitorConnection()
  },
  async setServerUrl({ commit }, url) {
    commit('setServerUrl', url)
  },
  async switchBackend({ rootGetters, commit, dispatch }, backend) {
    commit('setBackend', backend)

    if (backend == 'CLOUD') {
      await dispatch('getApi')
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
      await dispatch('license/getLicense', rootGetters['tenant/tenant'].id, {
        root: true
      })
    } else if (backend == 'SERVER') {
      try {
        await dispatch('getApi')
        await dispatch('tenant/getTenants', null, { root: true })
        await dispatch('tenant/getServerTenant', null, { root: true })
      } catch {
        commit('tenant/unsetTenants', null, { root: true })
        commit('tenant/unsetTenant', null, { root: true })
      }
    }

    dispatch('monitorConnection')
  }
}

export default {
  getters,
  mutations,
  state,
  actions,
  namespaced: true
}
