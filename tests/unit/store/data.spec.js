import data from '@/store/data'
import { createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(Vuex)

let mockError = false
jest.mock('@/vue-apollo', () => {
  return {
    fallbackApolloClient: {
      query: () => {
        if (!mockError) {
          return {
            data: {}
          }
        } else {
          return { data: 'error' }
        }
      }
    }
  }
})

const dataObjects = ['flow', 'project', 'task']

const flowGenerator = (len = 5) => {
  return Array.from({ length: len }, (v, i) => {
    return {
      id: 'f' + i,
      flow_group_id: 'fg' + i,
      name: 'Flow ' + i,
      project_id: 'p' + Math.floor(Math.random() * 5) // Random project id between p0 and p5
    }
  })
}

const projectGenerator = (len = 5) => {
  return Array.from({ length: len }, (v, i) => {
    return {
      id: 'p' + i,
      name: 'Project ' + i
    }
  })
}
const taskGenerator = (len = 5) => {
  return Array.from({ length: len }, (v, i) => {
    return {
      id: 't' + i,
      name: 'Task ' + i,
      flow_id: 'f' + Math.floor(Math.random() * 5) // Random flow id between f0 and f5
    }
  })
}

describe('data Vuex Module', () => {
  const unsetState = () => {
    return {
      activeFlow: null,
      activeProject: null,
      activeTask: null,
      flows: null,
      projects: null,
      tasks: null
    }
  }

  const setState = () => {
    const flows = flowGenerator()
    const projects = projectGenerator()
    const tasks = taskGenerator()

    const activeTask = tasks[Math.floor(Math.random() * 5)] // Random activeTask
    const activeFlow = flows.find(f => f.id == activeTask.flow_id) // activeFlow based on activeTask
    const activeProject = projects.find(p => p.id == activeFlow.project_id) // activeProject based on activeFlow

    return {
      activeFlow: activeFlow,
      activeProject: activeProject,
      activeTask: activeTask,
      flows: flows,
      projects: projects,
      tasks: tasks
    }
  }

  describe('State', () => {
    it('should hold data', () => {
      const state = data.state
      expect(state.activeFlow).toBe(null)
      expect(state.activeProject).toBe(null)
      expect(state.activeTask).toBe(null)

      expect(state.flows).toBe(null)
      expect(state.projects).toBe(null)
      expect(state.tasks).toBe(null)
    })
  })

  describe('getters', () => {
    describe('while unset', () => {
      let store, state
      beforeEach(() => {
        state = unsetState()
        console.log('State: ', state)
        store = new Vuex.Store({
          state: state,
          getters: data.getters,
          actions: data.actions,
          mutations: data.mutations
        })
      })

      dataObjects.forEach(d => {
        const active = 'active' + d.charAt(0).toUpperCase() + d.slice(1)
        const plural = d + 's'

        test(`${active} getter should return null`, () => {
          expect(store.getters[active]).toEqual(null)
        })

        test(`${plural} getter should return null`, () => {
          expect(store.getters[plural]).toEqual(null)
        })
      })
    })

    describe('while set', () => {
      let store, state
      beforeEach(() => {
        state = setState()
        console.log('State: ', state)
        store = new Vuex.Store({
          state: state,
          getters: data.getters,
          actions: data.actions,
          mutations: data.mutations
        })
      })

      dataObjects.forEach(d => {
        const active = 'active' + d.charAt(0).toUpperCase() + d.slice(1)
        const plural = d + 's'

        test(`${active} getter should return the state activeFlow object`, () => {
          expect(store.getters[active]).toEqual(state[active])
        })

        test(`${plural} getter should return a list of flows`, () => {
          expect(store.getters[plural]).toEqual(state[plural])
        })
      })
    })
  })

  describe('Mutations', () => {})
  //   let store
  //   beforeEach(() => {
  //     store = new Vuex.Store({
  //       state: unsetState(),
  //       getters: data.getters,
  //       actions: data.actions,
  //       mutations: data.mutations
  //     })
  //   })

  // describe('setDefaultTenant', () => {
  //   it('should set the defaultTenant', () => {
  //     const tenant = loggedinTenantState().tenant
  //     store.commit('setDefaultTenant', tenant)
  //     expect(store.getters['defaultTenant']).toEqual(
  //       loggedinTenantState().tenant
  //     )
  //   })
  //   it('should throw an error if passed an invalid tenant', () => {
  //     expect(() => store.commit('setDefaultTenant', [1, 2, 3])).toThrow(
  //       'passed invalid or empty tenant object'
  //     )
  //   })

  //   it('should throw an error if passed no tenant', () => {
  //     expect(() => store.commit('setDefaultTenant')).toThrow(
  //       'passed invalid or empty tenant object'
  //     )
  //   })

  //   it('should throw an error if passed an empty tenant', () => {
  //     expect(() => store.commit('setDefaultTenant', {})).toThrow(
  //       'passed invalid or empty tenant object'
  //     )
  //   })
  // })

  // describe('setTenant', () => {
  //   it('should set tenantIsSet to true', () => {
  //     store.commit('setTenant', loggedinTenantState().tenant)
  //     expect(store.getters['tenantIsSet']).toBe(true)
  //     expect(store.getters['tenant']).toEqual(loggedinTenantState().tenant)
  //   })

  //   it('should throw an error if given no tenant', () => {
  //     store.commit('unsetTenant')
  //     expect(() => store.commit('setTenant')).toThrow(
  //       'passed invalid or empty tenant object'
  //     )
  //   })

  //   it('should throw an error if given an empty tenant', () => {
  //     store.commit('unsetTenant')
  //     expect(() => store.commit('setTenant', {})).toThrow(
  //       'passed invalid or empty tenant object'
  //     )
  //   })
  // })

  // describe('setTenants', () => {
  //   it('should set the tenants array', () => {
  //     const tenants = loggedinTenantState().tenants
  //     store.commit('setTenants', tenants)
  //     expect(store.getters['tenants'][0]).toEqual(tenants[0])
  //   })

  //   it('should throw an error if given no tenants array', () => {
  //     store.commit('unsetTenants')
  //     expect(() => store.commit('setTenants')).toThrow(
  //       'passed invalid or empty tenant array'
  //     )
  //   })

  //   it('should throw an error if given an empty tenants array', () => {
  //     store.commit('unsetTenants')
  //     expect(() => store.commit('setTenants', [])).toThrow(
  //       'passed invalid or empty tenant array'
  //     )
  //   })
  // })

  // describe('unsetTenant', () => {
  //   it('should set tenantIsSet to false', () => {
  //     //Make sure store is in logged in state
  //     store.commit('setTenant', loggedinTenantState().tenant)
  //     expect(store.getters['tenant']).toEqual(loggedinTenantState().tenant)
  //     store.commit('unsetTenant')
  //     expect(store.getters['tenantIsSet']).toBe(false)
  //     expect(store.getters['tenant']).toEqual(initialTenantState().tenant)
  //   })
  // })

  // describe('unsetTenants', () => {
  //   it('should set tenants to an empty array', () => {
  //     //Make sure store is in logged in state
  //     store.commit('setTenants', loggedinTenantState().tenants)
  //     expect(store.getters['tenants']).toEqual(loggedinTenantState().tenants)
  //     store.commit('unsetTenants')
  //     expect(store.getters['tenants']).toEqual([])
  //   })
  // })

  // describe('updateTenantSettings', () => {
  //   it('should update the settings in the store and leave the rest of the tenant as is', () => {
  //     //Make sure store is in logged in state
  //     store.commit('setTenant', loggedinTenantState().tenant)
  //     expect(store.getters['tenant']).toEqual(loggedinTenantState().tenant)
  //     expect(store.getters['tenant'].settings.agreedToLicense).toEqual(false)
  //     expect(store.getters['tenantIsSet']).toEqual(
  //       loggedinTenantState().tenantIsSet
  //     )
  //     store.commit('updateTenantSettings', { agreedToLicense: true })
  //     expect(store.getters['tenant']).toEqual({
  //       ...loggedinTenantState().tenant,
  //       settings: { agreedToLicense: true }
  //     })
  //   })
  //   it('should throw an error message if no settings are passed', () => {
  //     expect(() => store.commit('updateTenantSettings')).toThrow(
  //       'passed invalid or empty settings object'
  //     )
  //   })
  // })
  // })

  // describe('actions', () => {
  //   let store
  //   beforeEach(() => {
  //     store = new Vuex.Store({
  //       state: unsetState(),
  //       getters: data.getters,
  //       actions: data.actions,
  //       mutations: data.mutations
  //     })
  //   })

  //   describe('getTenants - no query error', () => {
  //     let store

  //     beforeEach(() => {
  //       store = new Vuex.Store({
  //         state: initialTenantState(),
  //         getters: tenant.getters,
  //         mutations: tenant.mutations,
  //         actions: tenant.actions
  //       })
  //     })

  //     it('should call the prefectTenants method', async () => {
  //       await store.dispatch('getTenants')
  //       expect(prefectTenants).toHaveBeenCalled()
  //     })

  //     it('should set tenants', async () => {
  //       const tenantsArray = [{ name: 'boo', id: '12345' }]
  //       prefectTenants.mockReturnValueOnce(tenantsArray)
  //       await store.dispatch('getTenants')
  //       expect(store.getters.tenants).toEqual(tenantsArray)
  //     })

  //     it('should return tenants', async () => {
  //       const tenantsArray = [{ name: 'boo', id: '12345' }]
  //       prefectTenants.mockReturnValueOnce(tenantsArray)
  //       const returnedTenants = await store.dispatch('getTenants')
  //       expect(returnedTenants).toEqual([{ name: 'boo', id: '12345' }])
  //     })
  //   })

  //   describe('setCurrentTenant - Server', () => {
  //     let store

  //     beforeEach(() => {
  //       store = new Vuex.Store({
  //         state: initialTenantState(),
  //         getters: tenant.getters,
  //         mutations: tenant.mutations,
  //         actions: tenant.actions
  //       })
  //     })

  //     it('should throw an error if no slug is provided', () => {
  //       expect(store.dispatch('setCurrentTenant', false)).rejects.toThrow(
  //         'No slug was provided when trying to set the current tenant'
  //       )
  //     })

  //     it('should call getTenants if the passed tenant is not present in the store', async () => {
  //       expect(store.getters.tenant.slug).toBe(null)
  //       expect(store.getters.tenant.name).toBe(null)
  //       expect(store.getters.tenant.id).toBe(null)
  //       const tenantsArray = [
  //         { name: 'boo', id: '12345', slug: 'team2' },
  //         { name: 'anotherTenant', id: '45678' }
  //       ]
  //       prefectTenants.mockReturnValueOnce(tenantsArray)
  //       await store.dispatch('setCurrentTenant', 'team2')
  //       expect(store.getters.tenant.slug).toEqual('team2')
  //       expect(store.getters.tenant.name).toEqual('boo')
  //       expect(store.getters.tenant.id).toEqual('12345')
  //     })

  //     it('should throw an error if the requested tenant does not exist', async () => {
  //       expect(store.getters.tenant.slug).toBe(null)
  //       const tenantsArray = [{ name: 'boo', id: '12345', slug: 'team2' }]
  //       prefectTenants.mockReturnValueOnce(tenantsArray)
  //       expect(store.dispatch('setCurrentTenant', 'team3')).rejects.toThrow(
  //         "Error: Unable to set current tenant: tenant doesn't exist"
  //       )
  //     })

  //     it('should set the tenant role to TENANT_ADMIN', async () => {
  //       //All tenants need an admin - for tenants in server with only one member, that member's role should be admin
  //       expect(store.getters.tenant.slug).toBe(null)
  //       const tenantsArray = [{ name: 'boo', id: '12345', slug: 'team2' }]
  //       prefectTenants.mockReturnValueOnce(tenantsArray)
  //       await store.dispatch('setCurrentTenant', 'team2')
  //       expect(store.getters.role).toEqual('TENANT_ADMIN')
  //     })

  //     it('should return the tenant', async () => {
  //       const tenantsArray = [{ name: 'boo', id: '12345', slug: 'team2' }]
  //       prefectTenants.mockReturnValueOnce(tenantsArray)
  //       expect(await store.dispatch('setCurrentTenant', 'team2')).toEqual({
  //         id: '12345',
  //         name: 'boo',
  //         role: 'TENANT_ADMIN',
  //         slug: 'team2'
  //       })
  //     })
  //   })

  //   describe('setCurrentTenant - Cloud', () => {
  //     let store

  //     beforeEach(() => {
  //       tenant.actions['auth0/updateAuthorization'] = jest.fn
  //       tenant.actions['license/getLicense'] = jest.fn()
  //       store = new Vuex.Store({
  //         state: initialTenantState(),
  //         getters: {
  //           ...tenant.getters,
  //           'api/isCloud': () => true,
  //           'user/memberships': () => [
  //             { tenant: { id: '12345' }, role: 'USER' },
  //             { tenant: { id: '45678' }, role: 'TENANT_ADMIN' },
  //             { tenant: { id: '9101112' }, role: 'READ_ONLY_USER' }
  //           ]
  //         },
  //         mutations: tenant.mutations,
  //         actions: tenant.actions
  //       })
  //     })

  //     it('should set the tenant role according to user memberships - USER role', async () => {
  //       expect(store.getters.tenant.slug).toBe(null)
  //       const tenantsArray = [
  //         { name: 'boo', id: '12345', slug: 'team2' },
  //         { name: 'anotherTeam', id: '45678', slug: 'team3' }
  //       ]
  //       prefectTenants.mockReturnValueOnce(tenantsArray)
  //       await store.dispatch('setCurrentTenant', 'team2')
  //       expect(store.getters.role).toEqual('USER')
  //     })

  //     it('should set the tenant role according to user memberships - TENANT_ADMIN role', async () => {
  //       expect(store.getters.tenant.slug).toBe(null)
  //       const tenantsArray = [
  //         { name: 'boo', id: '12345', slug: 'team2' },
  //         { name: 'anotherTeam', id: '45678', slug: 'team3' },
  //         { name: 'aReadOnlyTeam', id: '9101112', slug: 'team1' }
  //       ]
  //       prefectTenants.mockReturnValueOnce(tenantsArray)
  //       await store.dispatch('setCurrentTenant', 'team1')
  //       expect(store.getters.role).toEqual('READ_ONLY_USER')
  //     })
  //   })

  //   describe('updateTenantSettings', () => {
  //     let store

  //     beforeEach(() => {
  //       tenant.actions.getTenants = jest.fn()
  //       store = new Vuex.Store({
  //         state: initialTenantState(),
  //         getters: tenant.getters,
  //         mutations: tenant.mutations,
  //         actions: tenant.actions
  //       })
  //     })

  //     it('should throw an error if no settings are given', async () => {
  //       expect(store.dispatch('updateTenantSettings')).rejects.toThrow(
  //         'Error: passed invalid or empty settings object'
  //       )
  //     })

  //     it('should call the getTenants action when settings are given', async () => {
  //       await store.dispatch('updateTenantSettings', { name: 'Tom' })
  //       expect(tenant.actions.getTenants).toBeCalled()
  //     })

  //     it('should call the update tenant settings mutation when settings are given', async () => {
  //       await store.dispatch('updateTenantSettings', { name: 'Tom' })
  //       expect(mockUpdate).toBeCalledWith({ name: 'Tom' })
  //     })
  //   })
  // })
})
