const state = {
  flows: null,
  labels: {}
}

const getters = {
  updatedLabels(state) {
    return state.labels
  }
}

const mutations = {
  setTempLabels(state, labels) {
    state.labels[labels.flowId] = labels.newLabels
  }
}

export default {
  getters,
  mutations,
  state,
  namespaced: true
}
