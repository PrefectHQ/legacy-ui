const state = {
  uniqueId: -1,
  tenants: [],
  agents: [],
  projects: [],
  flows: []
}

const getters = {
  shouldPollTenants(state) {
    return state.tenants.length > 0
  },
  shouldPollAgents(state) {
    return state.agents.length > 0
  },
  shouldPollProjects(state) {
    return state.projects.length > 0
  },
  shouldPollFlows(state) {
    return state.flows.length > 0
  }
}

const mutations = {
  incrementUniqueId(state) {
    state.uniqueId++
  },
  addSubscriber(state, { stream, uniqueId }) {
    if (state[stream].indexOf(uniqueId) == -1) {
      state[stream].push(uniqueId)
    }
  },
  removeSubscriber(state, { stream, uniqueId }) {
    if (state[stream].indexOf(uniqueId) != -1) {
      state[stream] = [...state[stream].filter(id => id != uniqueId)]
    }
  }
}

const actions = {
  getUniqueId({ commit, state }) {
    commit('incrementUniqueId')

    return state.uniqueId
  },
  async subscribe({ commit, dispatch }, streams) {
    const uniqueId = await dispatch('getUniqueId')
    const addSubscriber = stream =>
      commit('addSubscriber', { uniqueId, stream })

    if (!Array.isArray(streams)) {
      streams = [streams]
    }

    streams.forEach(addSubscriber)

    return () => dispatch('unsubscribe', { uniqueId, streams })
  },
  unsubscribe({ commit }, { uniqueId, streams }) {
    streams.forEach(stream => commit('removeSubscriber', { uniqueId, stream }))
  }
}

export default {
  getters,
  mutations,
  state,
  actions,
  namespaced: true
}
