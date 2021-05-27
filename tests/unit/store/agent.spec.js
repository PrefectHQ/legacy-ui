import agent from '@/store/agent'
import { createLocalVue } from '@vue/test-utils'
import { now } from 'moment'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

describe('Agent Vuex Module', () => {
  const initialAgentState = () => {
    return {
      thresholds: {
        // Time before an agent becomes stale
        stale: 3, // minutes since last query
        // Time before an agent becomes unhealthy
        unhealthy: 120 // minutes since last query
      },
      agents: null,
      sortedAgents: null
    }
  }

  describe('initial state', () => {
    it('should have a stale threshold and unhealthy threshold', () => {
      const state = agent.state
      expect(state.thresholds.stale).toBe(3)
      expect(state.thresholds.unhealthy).toBe(120)
    })
    it('should have no agents', () => {
      const state = agent.state
      expect(state.agents).toBe(null)
    })
    it('should have no sorted agents', () => {
      const state = agent.state
      expect(state.sortedAgents).toBe(null)
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
    it('should return sorted agents when the sorted agents getters is called', () => {
      expect(store.getters.sortedAgents).toBe(null)
    })
  })

  describe('mutations', () => {
    let store = new Vuex.Store({
      state: initialAgentState(),
      getters: agent.getters,
      mutations: agent.mutations
    })

    it('should add new agents, and update status, when the setAgents mutation is called', () => {
      expect(store.getters.agents).toBe(null)
      const recentDate = new Date().toISOString()
      store.commit('setAgents', [
        { id: '12345', last_queried: recentDate },
        { id: '67890', last_queried: '2021-04-20T23:36:24.278841+00:00' },
        { id: '09876', last_queried: NaN }
      ])
      expect(store.getters.agents[0].status).toEqual('healthy')
      expect(store.getters.agents[1].status).toEqual('unhealthy')
      expect(store.getters.agents[2].status).toEqual('unhealthy')
    })

    it('should add submittable runs, and update status and runs, when the setSortedAgents mutation is called', () => {
      const recentDate = new Date().toISOString()
      store.commit('setAgents', [
        { id: '09876', last_queried: recentDate, labels: ['dev'] },
        { id: '12345', labels: ['prod'], last_queried: NaN }
      ])
      store.commit('setSortedAgents', [
        { id: '12345', labels: ['dev'], scheduled_start_time: recentDate },
        {
          id: '12345',
          labels: ['prod'],
          scheduled_start_time: '2021-04-20T23:36:24.278841+00:00'
        }
      ])
      expect(store.getters.agents[0].submittableRuns).toEqual([
        { id: '12345', labels: ['dev'], scheduled_start_time: recentDate }
      ])
      expect(store.getters.agents[0].lateRuns).toEqual([])
      expect(store.getters.agents[1].lateRuns).toEqual([
        {
          id: '12345',
          labels: ['prod'],
          scheduled_start_time: '2021-04-20T23:36:24.278841+00:00'
        }
      ])
    })
  })
})
