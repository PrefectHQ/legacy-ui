import uniqueId from 'lodash.uniqueid'

const state = {
  alert: {
    alertShow: false,
    alertMessage: '',
    alertType: null,
    alertLink: null,
    linkText: '',
    alertCopy: ''
  },
  notifications: [],
  notificationTimeouts: {}
}

const getters = {
  getAlert(state) {
    return state.alert
  },
  notifications(state) {
    return state.notifications
  },
  notificationTimeouts(state) {
    return state.notificationTimeouts
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
  },
  setNotifications(state, notifications = []) {
    state.notifications = notifications
  },
  setNotificationTimeout(state, { id, timeoutId }) {
    clearTimeout(state['notificationTimeouts'][id])
    state.notificationTimeouts[id] = timeoutId
  }
}

const actions = {
  setAlert({ commit }, alert, timeout = 6000) {
    commit('setAl', alert)
    setTimeout(commit, timeout, 'setEmpty')
  },
  addNotification({ getters, commit, dispatch }, notification) {
    const id = uniqueId('notification-')
    const notifications = [...getters['notifications']]
    notifications.push({ id: id, ...notification })

    commit('setNotifications', notifications)

    if (notification?.timeout) {
      const timeoutId = setTimeout(() => {
        dispatch('dismissNotification', { id })
      }, notification.timeout)

      commit('setNotificationTimeout', { id, timeoutId })
    }

    return id
  },
  dismissNotification({ getters, commit }, { id }) {
    const notifications = [...getters['notifications']]
    const index = notifications.findIndex(n => n.id == id)

    if (index > -1) {
      notifications.splice(index, 1)

      commit('setNotifications', notifications)
    }
  },
  updateNotification({ getters, commit, dispatch }, { id, notification }) {
    const notifications = [...getters['notifications']]
    const index = notifications.findIndex(n => n.id == id)

    if (index > -1) {
      notifications[index] = {
        ...notifications[index],
        ...notification
      }

      commit('setNotifications', notifications)

      if (notification.timeout) {
        const timeoutId = setTimeout(() => {
          dispatch('dismissNotification', { id })
        }, notification.timeout)

        commit('setNotificationTimeout', { id: notification.id, timeoutId })
      }
    }
  }
}

export default {
  getters,
  mutations,
  state,
  actions,
  namespaced: true
}
