import { fallbackApolloClient } from '@/vue-apollo'

const state = {
  thresholds: {
    // Time before an agent becomes stale
    stale: 1, // minutes since last query
    // Time before an agent becomes unhealthy
    unhealthy: 5 // minutes since last query,
  },
  agents: null
}

const getters = {
  staleThreshold(state) {
    return state.thresholds.stale
  },
  unhealthyThreshold(state) {
    return state.thresholds.unhealthy
  },
  agents(state) {
    return state.agents
  },
  agentLabels(state) {
    if (state.agents) {
      const labels = state.agents.reduce((accumulator, agent, index) => {
        accumulator.push({ [index]: agent.labels })
        return accumulator
      }, [])
      return labels
    }
    return null
  }
}

const mutations = {
  setAgents(state, agents) {
    state.agents = agents
  }
}

const actions = {
  async getAgents({ commit }) {
    try {
      const { data } = await fallbackApolloClient.query({
        query: require('@/graphql/Agent/agents.gql'),
        fetchPolicy: 'no-cache'
      })
      if (data.agents) {
        commit('setAgents', data.agents)
      }
    } catch (error) {
      commit('setAgents', null)
    }
  }
}

export default {
  getters,
  mutations,
  actions,
  state,
  namespaced: true
}
