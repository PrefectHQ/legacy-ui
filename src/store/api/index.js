import { fallbackApolloClient } from '@/vue-apollo'
import LogRocket from 'logrocket'

const maxRetries = 3

const state = {
  backend:
    localStorage.getItem('backend') || process.env.VUE_APP_BACKEND || 'SERVER',
  connected: true,
  connectionMessage: null,
  connectionTimeout: null,
  releaseTimestamp: null,
  apiMode: 'normal',
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
  apiMode(state) {
    return state.apiMode
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
    localStorage.setItem('backend', backend)
  },
  unsetBackend(state) {
    state.backend = null
    localStorage.removeItem('backend')
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
  setApiMode(state, apiMode) {
    state.apiMode = apiMode
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
    try {
      const { data } = await fallbackApolloClient.query({
        query: require('@/graphql/api.gql'),
        fetchPolicy: 'no-cache'
      })

      commit('setReleaseTimestamp', data.api.release_timestamp)
      commit('setVersion', data.api.version)
      commit('setConnected', true)
      commit('setApiMode', data.api.mode)
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
        const { data } = await fallbackApolloClient.query({
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
          commit('setApiMode', data.api.mode)
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
  async switchBackend({ commit, dispatch, rootGetters }, backend) {
    commit('setBackend', backend)
    commit('tenant/unsetTenant', null, { root: true })
    commit('tenant/unsetTenants', null, { root: true })

    if (backend == 'CLOUD') {
      await dispatch('auth0/authenticate', null, { root: true })
      await dispatch('auth0/authorize', null, { root: true })
      await dispatch('user/getUser', null, { root: true })
    }

    await dispatch('getApi')
    await dispatch('tenant/getTenants', null, { root: true })

    if (backend == 'SERVER') {
      commit('tenant/setDefaultTenant', rootGetters['tenant/tenants']?.[0], {
        root: true
      })
    }

    if (rootGetters['tenant/defaultTenant']?.slug) {
      await dispatch(
        'tenant/setCurrentTenant',
        rootGetters['tenant/defaultTenant']?.slug,
        { root: true }
      )
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
