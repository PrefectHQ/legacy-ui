jest.mock('@/main', () => {
  return {
    TokenWorker: {
      postMessage: jest.fn()
    }
  }
})

import Vuex from 'vuex'
import alert from '@/store/alert'
import store from '@/store'
jest.useFakeTimers()

describe('Alert Vuex Module', () => {
  describe('Global Alert', () => {
    it('should initially have a show key that is false and other keys should be falsey', () => {
      expect(store.getters['alert/getAlert']).toStrictEqual({
        alertShow: false,
        alertMessage: '',
        alertType: null,
        alertLink: null,
        linkText: ''
      })
    })

    describe('mutations', () => {
      it('updates the state when setAl is called', () => {
        expect(store.getters['alert/getAlert']).toStrictEqual({
          alertShow: false,
          alertMessage: '',
          alertType: null,
          alertLink: null,
          linkText: ''
        })
        store.commit('alert/setAl', {
          alertShow: true,
          alertMessage: 'Testing testing 123',
          alertType: 'error',
          alertLink: null,
          linkText: ''
        })
        expect(store.getters['alert/getAlert']).toStrictEqual({
          alertShow: true,
          alertMessage: 'Testing testing 123',
          alertType: 'error',
          alertLink: null,
          linkText: ''
        })
      })
      it('empties the state when setEmpty is called', () => {
        store.commit('alert/setAl', {
          alertShow: true,
          alertMessage: 'Testing testing 123',
          alertType: 'error',
          alertLink: null,
          linkText: ''
        })
        expect(store.getters['alert/getAlert']).toStrictEqual({
          alertShow: true,
          alertMessage: 'Testing testing 123',
          alertType: 'error',
          alertLink: null,
          linkText: ''
        })
        store.commit('alert/setEmpty')
        expect(store.getters['alert/getAlert']).toStrictEqual({
          alertShow: false,
          alertMessage: '',
          alertType: null,
          alertLink: null,
          linkText: ''
        })
      })
    })

    describe('actions', () => {
      test('setAlert sets the new alert state, calls setTimeout and then empties the alert state', async () => {
        await store.dispatch('alert/setAlert', {
          alertShow: true,
          alertMessage: 'Testing testing 234',
          alertType: 'error',
          alertLink: null,
          linkText: ''
        })
        expect(store.getters['alert/getAlert']).toStrictEqual({
          alertShow: true,
          alertMessage: 'Testing testing 234',
          alertType: 'error',
          alertLink: null,
          linkText: ''
        })
        expect(setTimeout).toHaveBeenCalledTimes(1)
        expect(setTimeout).toHaveBeenLastCalledWith(
          expect.any(Function),
          6000,
          'setEmpty'
        )
      })
    })
  })

  describe('Notifications', () => {
    describe('getters', () => {
      it('should return notifications', () => {
        const notifications = ['foo', 'bar', 'batz']

        const store = new Vuex.Store({
          state: { ...alert.state, notifications: [...notifications] },
          getters: alert.getters
        })

        expect(store.getters.notifications).toStrictEqual(notifications)
      })

      it('should return notificationTimeouts', () => {
        const notificationTimeouts = { 0: 123, 1: 456 }

        const store = new Vuex.Store({
          state: {
            ...alert.state,
            notificationTimeouts: Object.assign({}, notificationTimeouts)
          },
          getters: alert.getters
        })

        expect(store.getters.notificationTimeouts).toStrictEqual(
          notificationTimeouts
        )
      })
    })

    describe('mutations', () => {})
    describe('actions', () => {})
  })
})
