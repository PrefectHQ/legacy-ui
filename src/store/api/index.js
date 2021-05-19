import { fallbackApolloClient } from '@/vue-apollo'
import LogRocket from 'logrocket'

const SERVER_KEY = `${process.env.VUE_APP_RELEASE_TIMESTAMP}_server_url`

const maxRetries = 3

const state = {
  backend: process.env.VUE_APP_BACKEND || 'SERVER',
  connected: true,
  connectionMessage: null,
  connectionTimeout: null,
  coreVersion: null,
  releaseTimestamp: null,
  apiMode: null,
  cloudUrl: process.env.VUE_APP_CLOUD_URL,
  retries: 0,
  serverUrl:
    localStorage.getItem(SERVER_KEY) ||
    window.prefect_ui_settings?.server_url ||
    process.env.VUE_APP_SERVER_URL,
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
  },
  coreVersion(state) {
    return state.coreVersion
  }
}

const mutations = {
  setBackend(state, backend) {
    if (backend !== 'CLOUD' && backend !== 'SERVER') {
      throw new Error('Invalid backend')
    }
    state.backend = backend
  },
  unsetBackend(state) {
    state.backend = null
  },
  setConnected(state, connected) {
    if (typeof connected !== 'boolean') {
      throw new Error('Invalid connected state - connected should be a boolean')
    }
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
    if (apiMode && apiMode !== 'normal' && apiMode !== 'maintenance') {
      throw new Error('Unexpected api mode')
    }
    state.apiMode = apiMode
  },
  unsetReleaseTimetamp(state) {
    state.releaseTimestamp = null
  },
  setRetries(state, retries) {
    state.retries = retries
  },
  setServerUrl(state, url) {
    state.serverUrl = url
    localStorage.setItem(SERVER_KEY, url)
  },
  unsetServerUrl(state) {
    state.serverUrl = null
    localStorage.removeItem(SERVER_KEY)
  },
  setVersion(state, version) {
    state.version = version
  },
  unsetVersion(state) {
    state.version = null
  },
  setCoreVersion(state, version) {
    console.log(version)
    state.coreVersion = version
  },
  unsetCoreVersion(state) {
    console.log('unsetting core version')
    state.coreVersion = null
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
      commit('setCoreVersion', data.api.core_version)
      commit('setConnected', true)
      commit('setApiMode', data.api.mode)
    } catch (error) {
      console.log(error)
      commit('unsetReleaseTimetamp')
      commit('unsetVersion')
      commit('unsetCoreVersion')
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
        } else {
          throw new Error('no data returned from api query')
        }
      } catch (e) {
        commit('setConnectionMessage', e.toString())
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
      await dispatch('auth/authenticate', null, { root: true })
      await dispatch('auth/authorize', null, { root: true })
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
