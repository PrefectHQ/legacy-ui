const state = {
  alert: {
    alertShow: false,
    alertMessage: '',
    alertType: null,
    alertLink: null,
    linkText: '',
    alertCopy: ''
  }
}

const getters = {
  getAlert(state) {
    return state.alert
  }
}

const mutations = {
  setAl(state, alert) {
    state.alert = alert
  },
  setEmpty(state) {
    state.alert = {
      alertShow: false,
      alertMessage: '',
      alertType: null,
      alertLink: null,
      linkText: '',
      alertCopy: ''
    }
  }
}

const actions = {
  setAlert({ commit }, alert, timeout = 6000) {
    commit('setAl', alert)
    setTimeout(commit, timeout, 'setEmpty')
  }
}

export default {
  getters,
  mutations,
  state,
  actions,
  namespaced: true
}
