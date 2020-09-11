import flow from '@/store/flow'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Flow Vuex Module', () => {
  const initialFlowState = () => {
    return {
      flows: null,
      labels: {}
    }
  }

  describe('initial state', () => {
    it('should have no flows', () => {
      const state = flow.state
      expect(state.flows).toBe(null)
    })
    it('should have no labels', () => {
      const state = flow.state
      expect(state.labels).toEqual({})
    })
  })

  describe('getters', () => {
    let store = new Vuex.Store({
      state: initialFlowState(),
      getters: flow.getters
    })

    it('should return updated labels when the updatedLabels getter is called', () => {
      expect(store.getters.updatedLabels).toEqual({})
    })
  })

  describe('mutationss', () => {
    let store = new Vuex.Store({
      state: initialFlowState(),
      getters: flow.getters,
      mutations: flow.mutations
    })

    it('should add new temporary labels when the setTempLabels mutation is called', () => {
      expect(store.getters.updatedLabels).toEqual({})
      store.commit('setTempLabels', { flowId: '12345', newLabels: ['a', 'b'] })
      expect(store.getters.updatedLabels).toEqual({
        '12345': ['a', 'b']
      })
    })
  })
})
