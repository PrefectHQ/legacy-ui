import flowNavGuard from '@/middleware/flowNavGuard'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

//simple mock for gql api query

jest.mock('@/vue-apollo', () => {
  return {
    fallbackApolloClient: {
      query: arg => {
        if (arg.query == 'flow group') {
          if (arg.variables.id == '123') {
            return {
              data: {
                flow_group_by_pk: {
                  id: '123'
                }
              }
            }
          } else {
            return { data: 'error' }
          }
        }
        if (arg.query == 'flow') {
          if (arg.variables.id == '456') {
            return {
              data: {
                flow_by_pk: {
                  flow_group_id: '123',
                  id: '12345',
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
  test('if there is a flow group that matches the passed id, it returns next', async () => {
    const next = jest.fn()
    await flowNavGuard({ name: 'flow', params: { id: '123' } }, {}, next)
    expect(next).toBeCalledWith()
  })
  test('if there is no flow group that matches the passed id, it checks the flow id and returns next if it matches', async () => {
    const next = jest.fn()
    await flowNavGuard({ name: 'flow', params: { id: '456' } }, {}, next)
    expect(next).toBeCalledWith({
      name: 'flow',
      params: { id: '123' },
      query: { version: 3 }
    })
  })
  test('if there is no flow or flow group that matches the passed id, it forwards to a 404', async () => {
    const next = jest.fn()
    await flowNavGuard({ name: 'flow', params: { id: '789' } }, {}, next)
    expect(next).toBeCalledWith({
      name: 'not-found'
    })
  })
})
