const state = {
  projects: []
}

const getters = {
  projects(state) {
    return state.projects
  }
}

const mutations = {
  setProjects(state, projects) {
    state.projects = projects
  },
  unsetProjects(state) {
    state.projects = []
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
