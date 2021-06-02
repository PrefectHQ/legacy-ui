import moment from '@/utils/moment'

//helper functions for sorting agents
const getTimeOverdue = time => new Date() - new Date(time)
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
const labelsAlign = (agent, flowRuns) => {
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
  }
}

const state = {
  thresholds: {
    // Time before an agent becomes stale
    stale: 60, // minutes since last query
    // Time before an agent becomes unhealthy
    unhealthy: 720 // minutes since last query,
  },
  agents: null,
  sortedAgents: null,
  sorting: true,
  refetch: false,
  intervalId: null,
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
  },
  refetchAgents(state) {
    return state.refetch
  }
}

const mutations = {
  setRefetch(state, bool) {
    state.refetch = bool
  },
  setSortedAgents(state, data) {
    if (data?.agent) state.agents = data?.agent
    if (data?.flow_run) state.flowRuns = data?.flow_run

    const agents = [...state.agents]
    const runsList = []
    const newList = []
    const oldList = []
    agents.forEach(agent => {
      labelsAlign(agent, state.flowRuns)
      agentHealth(agent)
      if (agent.lateRuns?.length && agent.status != 'unhealthy') {
        agent.status = 'late'
        runsList.push(agent)
      } else if (agent.submittableRuns?.length && agent.status === 'healthy') {
        runsList.push(agent)
      } else if (agent.status === 'healthy') {
        newList.push(agent)
      } else {
        oldList.push(agent)
      }
    })
    oldList.sort((a, b) => a.secondsSinceLastQuery - b.secondsSinceLastQuery)
    const fullList = [...runsList, ...newList, ...oldList]
    state.sortedAgents = fullList

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
