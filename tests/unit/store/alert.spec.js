jest.mock('@/main', () => {
  return {
    TokenWorker: {
      postMessage: jest.fn()
    }
  }
})

import uniqueId from 'lodash/uniqueId'
jest.mock('lodash/uniqueId')

import Vuex from 'vuex'
import alert from '@/store/alert'
import store from '@/store'

jest.useFakeTimers()

const initialState = { ...alert.state }
const getInitialState = () => {
  return { ...initialState }
}

describe('Alert Vuex Module', () => {
  describe('Global Alert', () => {
    it('should initially have a show key that is false and other keys should be falsey', () => {
      expect(store.getters['alert/getAlert']).toStrictEqual({
        alertShow: false,
        alertMessage: '',
        alertType: null,
        alertLink: null,
        linkText: '',
        alertCopy: ''
      })
    })

    describe('mutations', () => {
      it('updates the state when setAl is called', () => {
        expect(store.getters['alert/getAlert']).toStrictEqual({
          alertShow: false,
          alertMessage: '',
          alertType: null,
          alertLink: null,
          linkText: '',
          alertCopy: ''
        })
        store.commit('alert/setAl', {
          alertShow: true,
          alertMessage: 'Testing testing 123',
          alertType: 'error',
          alertLink: null,
          linkText: '',
          alertCopy: ''
        })
        expect(store.getters['alert/getAlert']).toStrictEqual({
          alertShow: true,
          alertMessage: 'Testing testing 123',
          alertType: 'error',
          alertLink: null,
          linkText: '',
          alertCopy: ''
        })
      })
      it('empties the state when setEmpty is called', () => {
        store.commit('alert/setAl', {
          alertShow: true,
          alertMessage: 'Testing testing 123',
          alertType: 'error',
          alertLink: null,
          linkText: '',
          alertCopy: ''
        })
        expect(store.getters['alert/getAlert']).toStrictEqual({
          alertShow: true,
          alertMessage: 'Testing testing 123',
          alertType: 'error',
          alertLink: null,
          linkText: '',
          alertCopy: ''
        })
        store.commit('alert/setEmpty')
        expect(store.getters['alert/getAlert']).toStrictEqual({
          alertShow: false,
          alertMessage: '',
          alertType: null,
          alertLink: null,
          linkText: '',
          alertCopy: ''
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
          linkText: '',
          alertCopy: ''
        })
        expect(store.getters['alert/getAlert']).toStrictEqual({
          alertShow: true,
          alertMessage: 'Testing testing 234',
          alertType: 'error',
          alertLink: null,
          linkText: '',
          alertCopy: ''
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
          state: { ...getInitialState(), notifications: [...notifications] },
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

    describe('mutations', () => {
      let store

      beforeEach(() => {
        clearTimeout.mockClear()
        store = new Vuex.Store({
          state: getInitialState(),
          getters: alert.getters,
          actions: alert.actions,
          mutations: alert.mutations
        })
      })

      it('setNotifications correctly stores notifications', () => {
        const notifications = ['lorem', 'ipsum']

        store.commit('setNotifications', notifications)

        expect(store.getters.notifications).toStrictEqual(notifications)
      })

      it('setNotificationTimeout clears any existing timeout and stores a new timeout id', () => {
        const id = 'foo-bar'
        const timeoutId = 123
        const timeoutId2 = 456

        store.commit('setNotificationTimeout', { id, timeoutId })

        expect(store.getters.notificationTimeouts).toStrictEqual({
          [id]: timeoutId
        })

        store.commit('setNotificationTimeout', { id, timeoutId: timeoutId2 })

        expect(clearTimeout).toHaveBeenCalledWith(timeoutId)

        expect(store.getters.notificationTimeouts).toStrictEqual({
          [id]: timeoutId2
        })
      })
    })

    // addNotification
    // dismissNotification
    // updateNotification
    describe('actions', () => {
      let store
      const storeClear = () => {
        store = new Vuex.Store({
          state: getInitialState(),
          getters: alert.getters,
          actions: alert.actions,
          mutations: alert.mutations
        })
      }

      describe('addNotification', () => {
        beforeEach(storeClear)

        it('returns sequential ids for each call', async () => {
          let id

          uniqueId
            .mockReturnValueOnce(1)
            .mockReturnValueOnce(2)
            .mockReturnValueOnce(3)
            .mockReturnValueOnce(4)

          id = await store.dispatch('addNotification', { text: 'foo' })

          expect(id).toStrictEqual(1)

          id = await store.dispatch('addNotification', { text: 'bar' })

          expect(id).toStrictEqual(2)

          id = await store.dispatch('addNotification', { text: 'batz' })

          expect(id).toStrictEqual(3)

          id = await store.dispatch('addNotification', { text: 'fiz' })

          expect(id).toStrictEqual(4)
        })

        it('adds the passed notification to the store', async () => {
          const notification = { text: 'fix' }

          expect(store.getters.notifications).toStrictEqual([])

          const id = await store.dispatch('addNotification', notification)

          expect(store.getters.notifications).toStrictEqual([
            { id: id, ...notification }
          ])
        })

        // TODO: Add tests for timeout logic
      })

      describe('dismissNotification', () => {
        beforeEach(storeClear)

        it('removes the notification with the passed id from the store', async () => {
          const notification = { text: 'sabe' }

          uniqueId.mockReturnValueOnce(1)

          const id = await store.dispatch('addNotification', notification)

          expect(id).toStrictEqual(1)

          expect(store.getters.notifications).toStrictEqual([
            { id, ...notification }
          ])

          await store.dispatch('dismissNotification', { id: 1 })

          expect(store.getters.notifications).toStrictEqual([])
        })
      })

      describe('updateNotification', () => {
        beforeEach(storeClear)

        it('updates the notification with the passed id with new data', async () => {
          const notification = { text: 'sabe' }

          uniqueId.mockReturnValueOnce(1)

          const id = await store.dispatch('addNotification', notification)

          expect(store.getters.notifications).toStrictEqual([
            { id, ...notification }
          ])

          await store.dispatch('updateNotification', {
            id: 1,
            notification: { text: 'ebas' }
          })

          expect(store.getters.notifications[0].text).toStrictEqual('ebas')
        })

        // TODO: Add tests for timeout logic
      })
    })
  })
})
