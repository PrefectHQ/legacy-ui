import { defaultOptions } from '@/vue-apollo'
import { createApolloClient } from 'vue-cli-plugin-apollo/graphql-client'
import LogRocket from 'logrocket'

const state = {
  backend: null,
  version: null
}

const getters = {
  backend(state) {
    return state.backend
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
        commit('setVersion', data.api.version)
      }
    } catch (error) {
      commit('unsetBackend')
      commit('unsetVersion')

      LogRocket.captureException(error, {
        extra: {
          pageName: 'API Store',
          stage: 'getApi'
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
