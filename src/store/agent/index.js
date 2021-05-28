import moment from '@/utils/moment'

const state = {
  thresholds: {
    // Time before an agent becomes stale
    stale: 3, // minutes since last query
    // Time before an agent becomes unhealthy
    unhealthy: 120 // minutes since last query,
  },
  agents: null,
  sortedAgents: null,
  sorting: true,
  refetch: false
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
  },
  refetchAgents(state) {
    return state.refetch
  }
}

const mutations = {
  setRefetch(state, bool) {
    console.log('setRefetch')
    state.refetch = bool
  },
  setSortedAgents(state, flowRuns) {
    this.sorting = true
    if (!state.agents) {
      state.sortedAgents = null
      return
    }
    const getTimeOverdue = time => new Date() - new Date(time)
    const labelsAlign = agent => {
      agent.submittableRuns = []
      agent.lateRuns = []

      if (!agent.labels?.length) {
        const noLabels = flowRuns?.filter(flowRun => {
          return !flowRun?.labels?.length
        })
        agent.submittableRuns = noLabels?.filter(
          flowRun => getTimeOverdue(flowRun.scheduled_start_time) <= 20000
        )
        agent.lateRuns = noLabels?.filter(
          flowRun => getTimeOverdue(flowRun.scheduled_start_time) > 20000
        )
        return !!noLabels?.length
      } else {
        const match = flowRuns?.filter(
          flowRun =>
            flowRun?.labels?.length &&
            flowRun.labels.every(label => agent?.labels?.includes(label))
        )
        agent.submittableRuns = match?.filter(
          flowRun => getTimeOverdue(flowRun.scheduled_start_time) <= 20000
        )
        agent.lateRuns = match?.filter(
          flowRun => getTimeOverdue(flowRun.scheduled_start_time) > 20000
        )
        return !!match?.length
      }
    }
    const agents = [...state.agents]
    const runsList = []
    const newList = []
    const oldList = []
    agents.forEach(agent => {
      labelsAlign(agent)
      if (agent.lateRuns?.length) {
        agent.status = 'late'
        runsList.push(agent)
      } else if (agent.submittableRuns?.length) {
        runsList.push(agent)
      } else if (agent.status != 'unhealthy' && agent.status != 'old') {
        newList.push(agent)
      } else {
        agent.status = 'old'
        oldList.push(agent)
      }
    })

    oldList.sort((a, b) => a.secondsSinceLastQuery - b.secondsSinceLastQuery)
    const fullList = [...runsList, ...newList, ...oldList]
    state.sortedAgents = fullList

    state.refetch = false
    state.sorting = false
  },
  setAgents(state, agents) {
    state.sorting = true
    if (!agents) {
      state.agents = null
      return
    }
    state.agents = agents?.map(agent => {
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
    })
    state.refetch = false
    state.sorting = false
  }
}

export default {
  getters,
  mutations,
  state,
  namespaced: true
}
