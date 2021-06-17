import agent from '@/store/agent'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Agent Vuex Module', () => {
  const initialAgentState = () => {
    return {
      thresholds: {
        // Time before an agent becomes stale
        stale: 1, // minutes since last query
        // Time before an agent becomes unhealthy
        unhealthy: 5 // minutes since last query
      },
      agents: null
    }
  }

  describe('initial state', () => {
    it('should have a stale threshold and unhealthy threshold', () => {
      const state = agent.state
      expect(state.thresholds.stale).toBe(1)
      expect(state.thresholds.unhealthy).toBe(5)
    })
    it('should have no agents', () => {
      const state = agent.state
      expect(state.agents).toBe(null)
    })
  })

  describe('getters', () => {
    let store = new Vuex.Store({
      state: initialAgentState(),
      getters: agent.getters
    })

    it('should return the stale threshold when the staleThreshold getter is called', () => {
      expect(store.getters.staleThreshold).toBe(store.state.thresholds.stale)
    })

    it('should return the unhealthy threshold when the unhealthyThreshold getter is called', () => {
      expect(store.getters.unhealthyThreshold).toBe(
        store.state.thresholds.unhealthy
      )
    })
    it('should return agents when the agents getters is called', () => {
      expect(store.getters.agents).toBe(null)
    })
  })

  describe('mutations', () => {
    let store = new Vuex.Store({
      state: initialAgentState(),
      getters: agent.getters,
      mutations: agent.mutations
    })

    it('should add new agents, and update seconds since last query, when the setAgents mutation is called', () => {
      expect(store.getters.agents).toBe(null)
      store.commit('setAgents', [{ id: '12345' }])
      expect(store.getters.agents).toEqual([
        { id: '12345', secondsSinceLastQuery: 0 }
      ])
    })
  })
})
