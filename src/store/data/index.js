import { fallbackApolloClient } from '@/vue-apollo'

const state = {
  activeFlow: null,
  activeProject: null,
  activeTask: null,
  flows: null,
  projects: null,
  tasks: null
}

const getters = {
  activeFlow(state) {
    return state.activeFlow
  },
  activeFlowId(state) {
    return state.activeFlow?.id
  },
  activeProject(state) {
    return state.activeProject
  },
  activeProjectId(state) {
    return state.activeProject?.id
  },
  activeTask(state) {
    return state.activeTask
  },
  activeTaskId(state) {
    return state.activeTask?.id
  },
  flows(state) {
    return state.flows
  },
  projects(state) {
    return state.projects
  },
  tasks(state) {
    return state.tasks
  }
}

const mutations = {
  setActiveProject(state, project) {
    if (
      !project ||
      typeof project !== 'object' ||
      Array.isArray(project) ||
      Object.keys(project) < 1
    ) {
      throw new Error(
        'passed invalid or empty project; Expected Object, Got:',
        project
      )
    }

    state.activeProject = project
  },
  unsetActiveProject(state) {
    state.activeProject = null
  },
  setActiveFlow(state, flow) {
    state.activeFlow = flow
  },
  unsetActiveFlow(state) {
    state.activeFlow = null
  },
  setActiveTask(state, task) {
    state.activeTask = task
  },
  unsetActiveTask(state) {
    state.activeTask = null
  },
  addTasks(state, tasks) {
    tasks.forEach(task => {
      let taskIndex = state.tasks.find(t => t.id == task.id)

      if (taskIndex > -1) state.tasks[taskIndex] = task
      else state.tasks.push(task)
    })
  },
  setTasks(state, tasks) {
    state.tasks = tasks
  },
  unsetTasks(state) {
    state.tasks = null
  },
  setFlows(state, flows) {
    state.flows = flows
  },
  unsetFlows(state) {
    state.flows = null
  },
  setProjects(state, projects) {
    state.projects = projects
  },
  unsetProjects(state) {
    state.projects = null
  }
}

const actions = {
  async activateFlow({ commit, getters, dispatch }, id) {
    let flow = getters['flows']?.find(t => t.id == id || t.flow_group_id == id)

    if (!flow || flow.id !== id) {
      id = flow?.id || id

      const { data } = await fallbackApolloClient.query({
        query: require('@/graphql/Nav/flows.gql')
      })

      commit('setFlows', data.flow)

      flow = getters['flows'].find(t => t.id == id)
    }

    if (!flow) throw Error("Couldn't retreive flow.")

    commit('setActiveFlow', flow)
    await dispatch('activateProject', flow.project_id)
  },
  async activateProject({ commit, getters }, id) {
    let project = getters['projects']?.find(t => t.id == id)

    if (!project) {
      const { data } = await fallbackApolloClient.query({
        query: require('@/graphql/Nav/projects.gql')
      })

      commit('setProjects', data.project)

      project = getters['projects'].find(t => t.id == id)
    }

    if (!project) throw Error("Couldn't retrieve project.")

    commit('setActiveProject', project)
  },
  async activateTask({ commit, getters, dispatch }, id) {
    let task = getters['tasks']?.find(t => t.id == id)

    if (!task) {
      const { data } = await fallbackApolloClient.query({
        query: require('@/graphql/Nav/task.gql'),
        variables: {
          taskId: id
        }
      })

      commit('addTasks', data.task)

      task = getters['tasks'].find(t => t.id == id)
    }

    if (!task) throw Error("Couldn't retreive task.")

    commit('setActiveTask', task)
    await dispatch('activateFlow', task.flow_id)
  },
  resetActiveData({ commit }) {
    commit('unsetActiveFlow')
    commit('unsetActiveProject')
    commit('unsetActiveTask')
  },
  resetData({ commit }) {
    commit('unsetActiveFlow')
    commit('unsetActiveProject')
    commit('unsetActiveTask')
    commit('unsetFlows')
    commit('unsetProjects')
    commit('unsetTasks')
  }
}

export default {
  getters,
  mutations,
  state,
  actions,
  namespaced: true
}
