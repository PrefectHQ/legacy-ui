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

const generators = {
  flow: (len = 5) => {
    return Array.from({ length: len }, (v, i) => {
      return {
        id: 'f' + i,
        flow_group_id: 'fg' + i,
        name: 'Flow ' + i,
        project_id: 'p' + Math.floor(Math.random() * 5) // Random project id between p0 and p5
      }
    })
  },
  project: (len = 5) => {
    return Array.from({ length: len }, (v, i) => {
      return {
        id: 'p' + i,
        name: 'Project ' + i
      }
    })
  },
  task: (len = 5) => {
    return Array.from({ length: len }, (v, i) => {
      return {
        id: 't' + i,
        name: 'Task ' + i,
        flow_id: 'f' + Math.floor(Math.random() * 5) // Random flow id between f0 and f5
      }
    })
  }
}

// const flowGenerator = (len = 5) => {
//   return Array.from({ length: len }, (v, i) => {
//     return {
//       id: 'f' + i,
//       flow_group_id: 'fg' + i,
//       name: 'Flow ' + i,
//       project_id: 'p' + Math.floor(Math.random() * 5) // Random project id between p0 and p5
//     }
//   })
// }

// const projectGenerator = (len = 5) => {
//   return Array.from({ length: len }, (v, i) => {
//     return {
//       id: 'p' + i,
//       name: 'Project ' + i
//     }
//   })
// }
// const taskGenerator = (len = 5) => {
//   return Array.from({ length: len }, (v, i) => {
//     return {
//       id: 't' + i,
//       name: 'Task ' + i,
//       flow_id: 'f' + Math.floor(Math.random() * 5) // Random flow id between f0 and f5
//     }
//   })
// }

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
    const flows = generators.flow()
    const projects = generators.project()
    const tasks = generators.task()

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

  describe('Getters', () => {
    describe('while unset', () => {
      let store, state
      beforeEach(() => {
        state = unsetState()
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
        const id = active + 'Id'

        test(`${active} getter should return the state activeFlow object`, () => {
          expect(store.getters[active]).toEqual(state[active])
        })

        test(`${plural} getter should return a list of flows`, () => {
          expect(store.getters[plural]).toEqual(state[plural])
        })

        test(`${id} getter should return the id of ${active}`, () => {
          expect(store.getters[id]).toEqual(state[active].id)
        })
      })
    })
  })

  describe('Mutations', () => {
    let store, state
    beforeEach(() => {
      state = unsetState()
      store = new Vuex.Store({
        state: state,
        getters: data.getters,
        actions: data.actions,
        mutations: data.mutations
      })
    })

    const activeDataMutations = ['Flow', 'Project', 'Task']

    activeDataMutations.forEach(d => {
      describe(`setActive${d}`, () => {
        const error = `passed invalid or empty ${d}; Expected Object, got:`

        it(`should set the active${d}`, () => {
          const generated = generators[d.toLowerCase()](1)[0] // Creates a new random object
          store.commit(`setActive${d}`, generated)
          expect(store.getters[`active${d}`]).toEqual(generated)
        })

        it(`should throw an error if passed an invalid ${d} data type`, () => {
          expect(() => store.commit(`setActive${d}`, [1, 2, 3])).toThrow(error)
        })

        it(`should throw an error if passed no ${d}`, () => {
          expect(() => store.commit(`setActive${d}`)).toThrow(error)
        })

        it(`should throw an error if passed an empty ${d} object`, () => {
          expect(() => store.commit(`setActive${d}`, {})).toThrow(error)
        })
      })
    })
  })
})
