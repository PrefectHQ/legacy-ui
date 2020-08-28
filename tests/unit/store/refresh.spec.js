import refresh from '@/store/refresh'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Refresh Vuex Module', () => {
  const initialState = () => {
    return {
      componentKey: 0
    }
  }

  describe('State', () => {
    it('should be initally be set to 0', () => {
      const state = refresh.state
      expect(state.componentKey).toBe(0)
    })
  })

  describe('getters', () => {
    let store
    store = new Vuex.Store({
      state: initialState(),
      getters: refresh.getters,
      mutations: refresh.mutations
    })
    test('the componentKey getter returns 0 in intial state', () => {
      expect(store.getters.componentKey).toBe(0)
    })
  })

  describe('mutations', () => {
    let store
    store = new Vuex.Store({
      state: initialState(),
      getters: refresh.getters,
      mutations: refresh.mutations
    })
    test('the add mutation increase the componentKey by 1', () => {
      expect(store.getters.componentKey).toBe(0)
      store.commit('add')
      expect(store.getters.componentKey).toBe(0)
    })
  })
})
