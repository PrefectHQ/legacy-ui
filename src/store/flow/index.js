import { fallbackApolloClient } from '@/vue-apollo'

const state = {
  activeFlow: null,
  flows: []
}

const getters = {
  activeFlow(state) {
    return state.activeFlow
  },
  flows(state) {
    return state.flows
  }
}

const mutations = {
  setActiveFlow(state, flow) {
    state.activeFlow = flow
  },
  unsetActiveFlow(state) {
    state.activeFlow = null
  },
  setFlows(state, flows) {
    state.flows = flows
  },
  unsetFlows(state) {
    state.flows = []
  }
}

const actions = {
  async activateFlow({ commit, getters, dispatch }, id) {
    let flow = getters['flows'].find(t => t.id == id)

    if (!flow) {
      const { data } = await fallbackApolloClient.query({
        query: require('@/graphql/Nav/flows.gql')
      })

      commit('setFlows', data.flow)

      flow = getters['flows'].find(t => t.id == id)
    }

    if (!flow) throw Error("Could't retrive flow.")

    commit('setActiveFlow', flow)
    await dispatch('project/activateProject', flow.project_id, { root: true })
  }
}

export default {
  getters,
  mutations,
  state,
  actions,
  namespaced: true
}
