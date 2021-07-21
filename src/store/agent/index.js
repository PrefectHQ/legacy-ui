import moment from '@/utils/moment'

//helper functions for sorting

const agentHealth = agent => {
  if (agent.last_queried) {
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
  } else {
    agent.status = 'unhealthy'
  }
  return agent
}

const state = {
  thresholds: {
    // Time before an agent becomes stale
    stale: 5, // minutes since last query
    // Time before an agent becomes unhealthy
    unhealthy: 720 // minutes since last query,
  },
  agents: null,
  sortedAgents: null,
  sorting: true,
  flowRuns: null
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
  sortedAgents(state) {
    return state.sortedAgents
  },
  agent: state => id => {
    return state.agents?.filter(agent => agent.id === id)[0]
  },
  sortedAgent: state => id => {
    return state.sortedAgents?.filter(agent => agent.id === id)[0]
  },
  sorting(state) {
    return state.sorting
  }
}

const mutations = {
  setSortedAgents(state, agents) {
    if (!agents) {
      state.sortedAgents = null
      state.agents = []
      return
    }

    const healthyList = []
    const staleList = []
    const oldList = []
    agents.forEach(agent => {
      agentHealth(agent)
      if (agent.status === 'healthy') {
        healthyList.push(agent)
      } else if (agent.status === 'stale') {
        staleList.push(agent)
      } else {
        oldList.push(agent)
      }
    })
    state.agents = agents
    healthyList.sort((a, b) => a.id - b.id)
    oldList.sort((a, b) => a.secondsSinceLastQuery - b.secondsSinceLastQuery)
    const fullList = [...healthyList, ...staleList, ...oldList]
    state.sortedAgents = fullList
    state.sorting = false
  }
}

export default {
  getters,
  mutations,
  state,
  namespaced: true
}
