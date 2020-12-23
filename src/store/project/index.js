import { fallbackApolloClient } from '@/vue-apollo'

const state = {
  activeProject: null,
  projects: []
}

const getters = {
  activeProject(state) {
    return state.activeProject
  },
  projects(state) {
    return state.projects
  }
}

const mutations = {
  setActiveProject(state, project) {
    state.activeProject = project
  },
  unsetActiveProject(state) {
    state.activeProject = null
  },
  setProjects(state, projects) {
    state.projects = projects
  },
  unsetProjects(state) {
    state.projects = []
  }
}

const actions = {
  async activateProject({ commit, getters }, id) {
    let project = getters['projects'].find(t => t.id == id)

    if (!project) {
      const { data } = await fallbackApolloClient.query({
        query: require('@/graphql/Nav/projects.gql')
      })

      commit('setProjects', data.project)

      project = getters['projects'].find(t => t.id == id)
    }

    if (!project) throw Error("Could't retrive project.")

    commit('setActiveProject', project)
  }
}

export default {
  getters,
  mutations,
  state,
  actions,
  namespaced: true
}
