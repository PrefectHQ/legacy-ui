import moment from '@/utils/moment'

const state = {
  thresholds: {
    // Time before an agent becomes stale
    stale: 5, // minutes since last query
    // Time before an agent becomes unhealthy
    unhealthy: 10 // minutes since last query,
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
  agent: state => id => {
    return state.agents.filter(agent => agent.id === id)[0]
  }
}

const mutations = {
  setAgents(state, agents) {
    if (!agents) {
      state.agents = null
      return
    }
    state.agents = agents.map(agent => {
      const secondsSinceLastQuery = moment().diff(
        moment(agent.last_queried),
        'seconds'
      )
      agent.secondsSinceLastQuery = secondsSinceLastQuery
      agent.status =
        secondsSinceLastQuery < 60 * state.thresholds.stale
          ? 'healthy'
          : secondsSinceLastQuery < 60 * state.thresholds.unhealthy
          ? 'stale'
          : 'unhealthy'
      return agent
    })
  }
}

export default {
  getters,
  mutations,
  state,
  namespaced: true
}
