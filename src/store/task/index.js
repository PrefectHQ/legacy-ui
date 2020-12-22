const state = {
  tasks: []
}

const getters = {
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
  setTasks(state, tasks) {
    state.tasks = tasks
  },
  unsetTasks(state) {
    state.tasks = []
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
