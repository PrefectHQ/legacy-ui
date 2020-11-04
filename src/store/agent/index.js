import moment from '@/utils/moment'

const state = {
  thresholds: {
    // Time before an agent becomes stale
    stale: 1, // minutes since last query
    // Time before an agent becomes unhealthy
    unhealthy: 5 // minutes since last query,
  },
  agents: null,
  loading: false
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
  loading(state) {
    return state.loading
  }
}

const mutations = {
  setAgents(state, agents) {
    state.loading = true
    if (!agents) {
      state.agents = null
      return
    }
    state.agents = agents.map(agent => ({
      ...agent,
      secondsSinceLastQuery: moment().diff(
        moment(agent.last_queried),
        'seconds'
      )
    }))
    state.loading = false
  }
}

export default {
  getters,
  mutations,
  state,
  namespaced: true
}
