const state = {
  activeTask: null,
  tasks: []
}

const getters = {
  activeTask(state) {
    return state.activeTask
  },
  tasks(state) {
    return state.tasks
  }
}

const mutations = {
  addTasks(state, tasks) {
    tasks.forEach(task => {
      let taskIndex = state.tasks.find(t => t.id == task.id)

      if (taskIndex > -1) state.tasks[taskIndex] = task
      else state.tasks.push(task)
    })
  },
  removeFlowTasks(state, flowId) {
    state.tasks = state.tasks.filter(t => t.flow_id !== flowId)
  },
  setActiveTask(state, task) {
    state.activeTask = task
  },
  unsetActiveTask(state) {
    state.activeTask = null
  },
  setTasks(state, tasks) {
    state.tasks = tasks
  },
  unsetTasks(state) {
    state.tasks = []
  }
}

const actions = {
  async activateTask({ commit, getters, dispatch }, id) {
    let task = getters['tasks'].find(t => t.id == id)

    if (!task) {
      const { data } = await this.$apollo.query({
        query: require('@/graphql/Nav/task.gql'),
        variables: {
          taskId: id
        }
      })

      commit('addTasks', data.task)

      task = getters['tasks'].find(t => t.id == id)
    }

    if (!task) throw Error("Could't retrive task.")

    commit('setActiveTask', task)
    await dispatch('flow/activateFlow', task.flow_id, { root: true })
  }
}

export default {
  getters,
  mutations,
  state,
  actions,
  namespaced: true
}
