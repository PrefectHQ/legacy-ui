import flowNavGuard from '@/middleware/flowNavGuard'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import store from '@/store'

const flows = [
  {
    id: 'flow_id_1',
    flow_group_id: 'flow_group_id_1',
    version: 1
  }
]

//simple mock for gql api query
jest.mock('@/vue-apollo', () => {
  return {
    fallbackApolloClient: {
      query: arg => {
        if (arg.query == 'flow') {
          if (arg.variables.id == 'flow_id_2') {
            return {
              data: {
                flow_by_pk: {
                  id: 'flow_id_2',
                  flow_group_id: 'flow_group_id_2',
                  version: 3
                }
              }
            }
          } else {
            return { data: 'error' }
          }
        }
      }
    }
  }
})

jest.mock('@/graphql/Middleware/flow-group.gql', () => 'flow group')
jest.mock('@/graphql/Middleware/flow.gql', () => 'flow')

const localVue = createLocalVue()
localVue.use(Vuex)

describe('flowNavGuard', () => {
  afterEach(() => {
    store.commit('data/unsetFlows')
  })

  test('if there is a flow group that matches the passed id, it returns next', async () => {
    store.commit('data/setFlows', flows)
    const next = jest.fn()
    await flowNavGuard(
      { name: 'flow', params: { id: 'flow_group_id_1' } },
      {},
      next
    )
    expect(next).toBeCalledWith()
  })
  test('if there is no flow group that matches the passed id, it checks the flow id and returns next if it matches', async () => {
    const next = jest.fn()
    await flowNavGuard({ name: 'flow', params: { id: 'flow_id_2' } }, {}, next)
    expect(next).toBeCalledWith({
      name: 'flow',
      params: { id: 'flow_group_id_2' },
      query: { version: 3 }
    })
  })
  test('if there is no flow or flow group that matches the passed id, it forwards to a 404', async () => {
    const next = jest.fn()
    await flowNavGuard(
      { name: 'flow', params: { id: 'flow_group_id_3' } },
      {},
      next
    )
    expect(next).toBeCalledWith({
      name: 'not-found'
    })
  })
})
