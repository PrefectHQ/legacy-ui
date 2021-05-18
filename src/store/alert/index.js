const state = {
  alert: {
    alertShow: false,
    alertMessage: '',
    alertType: null,
    alertLink: null,
    linkText: ''
  },
  notifications: [
    { id: 1, text: 'foo' },
    { id: 2, text: 'bar' },
    { id: 3, text: 'batz' }
  ]
}

const getters = {
  getAlert(state) {
    return state.alert
  },
  notifications(state) {
    return state.notifications
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
      linkText: ''
    }
  },
  dismiss(state, notification) {
    const index = state.notifications.indexOf(
      n => n.text == notification.text && notification.id === n.id
    )
    state.notifications.splice(index, 1)
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
