import { defaultOptions } from '@/vue-apollo'
import { createApolloClient } from 'vue-cli-plugin-apollo/graphql-client'
import LogRocket from 'logrocket'

const state = {
  backend: null,
  releaseTimestamp: null,
  url: localStorage.getItem('api_url') || process.env.VUE_APP_GRAPHQL_HTTP,
  version: null
}

const getters = {
  backend(state) {
    return state.backend
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
    localStorage.setItem('api_url', url)
    state.url = url
  },
  unsetUrl(state) {
    localStorage.removeItem('api_url')
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
  async switchBackend({ getters, commit, dispatch }, url) {
    commit('setUrl', url)

    await dispatch('getApi')

    if (getters['isCloud']) {
      await dispatch('auth0/authenticate', null, { root: true })
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
