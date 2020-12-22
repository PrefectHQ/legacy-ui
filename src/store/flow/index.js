const state = {
  flows: []
}

const getters = {
  flows(state) {
    return state.flows
  }
}

const mutations = {
  setFlows(state, flows) {
    state.flows = flows
  },
  unsetFlows(state) {
    state.flows = []
  }
}

const actions = {}

export default {
  getters,
  mutations,
  state,
  actions,
  namespaced: true
}
