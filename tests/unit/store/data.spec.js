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
            data: {
              flow: [
                {
                  id: 'f-111',
                  flow_group_id: 'fg-111',
                  project_id: 'p-111',
                  name: 'Flow 111'
                }
              ],
              project: [
                {
                  id: 'p-111',
                  name: 'Project 111'
                }
              ],
              task: [
                {
                  id: 't-111',
                  flow_id: 'f-111',
                  name: 'Name 111'
                }
              ]
            }
          }
        } else {
          return { data: 'error' }
        }
      }
    }
  }
})

jest.mock('@/graphql/Nav/flows.gql', () => 'flows query string')
jest.mock('@/graphql/Nav/flow.gql', () => 'flow query string')
jest.mock('@/graphql/Nav/projects.gql', () => 'projects query string')
jest.mock('@/graphql/Nav/task.gql', () => 'tasks query string')

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

describe('data Vuex Module', () => {
  const unsetState = () => {
    return {
      activeFlow: null,
      activeProject: null,
      activeTask: null,
      flows: {},
      flowGroups: {},
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
      flows: flows.reduce(
        (result, flow) => ({ ...result, [flow.id]: flow }),
        {}
      ),
      flowGroups: flows.reduce(
        (result, flow) => ({ ...result, [flow.flow_group_id]: flow }),
        {}
      ),
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

      expect(state.flows).toStrictEqual({})
      expect(state.flowGroups).toStrictEqual({})
      expect(state.projects).toBe(null)
      expect(state.tasks).toBe(null)
    })
  })

  describe('Getters', () => {
    describe('while unset', () => {
      let state, store
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
      let state, store
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

        test(`${active} getter should return the state ${active} object`, () => {
          expect(store.getters[active]).toEqual(state[active])
        })

        test(`${plural} getter should return a list of ${plural}`, () => {
          expect(store.getters[plural]).toEqual(state[plural])
        })

        test(`${id} getter should return the id of ${active}`, () => {
          expect(store.getters[id]).toEqual(state[active].id)
        })
      })
    })
  })

  describe('Mutations', () => {
    let state, store
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
        const error = `passed invalid or empty ${d}; Expected Object, got: `

        it(`should set the active${d}`, () => {
          const generated = generators[d.toLowerCase()](1)[0] // Creates a new random object
          store.commit(`setActive${d}`, generated)
          expect(store.getters[`active${d}`]).toEqual(generated)
        })

        it(`should throw an error if passed an invalid ${d} data type`, () => {
          const toPass = [1, 2, 3]
          expect(() => store.commit(`setActive${d}`, toPass)).toThrow(
            error + toPass
          )
        })

        it(`should throw an error if passed no ${d}`, () => {
          expect(() => store.commit(`setActive${d}`)).toThrow(
            error + 'undefined'
          )
        })

        it(`should throw an error if passed an empty ${d} object`, () => {
          const toPass = {}
          expect(() => store.commit(`setActive${d}`, toPass)).toThrow(
            error + toPass
          )
        })
      })

      describe(`unsetActive${d}`, () => {
        let state, store
        beforeEach(() => {
          state = setState()
          store = new Vuex.Store({
            state: state,
            getters: data.getters,
            actions: data.actions,
            mutations: data.mutations
          })
        })

        it(`should unset the active${d}`, () => {
          expect(store.getters[`active${d}`].id).toEqual(state[`active${d}`].id)
          store.commit(`unsetActive${d}`)
          expect(store.getters[`active${d}`]).toEqual(null)
        })
      })
    })

    describe('addTasks', () => {
      it("should add passed tasks to the tasks array and should create it if it doesn't exist", () => {
        expect(state.tasks).toEqual(null)

        const tasks = generators.task(5)
        store.commit('addTasks', tasks)

        expect(state.tasks).toEqual(tasks)
        expect(state.tasks.length).toEqual(5)
      })

      it('should update existing tasks in the store if matching ids are passed', () => {
        expect(state.tasks).toEqual(null)

        const tasks = generators.task(5)
        const taskToChange = tasks[0]

        store.commit('addTasks', tasks)
        expect(state.tasks).toEqual(tasks)
        expect(state.tasks.length).toEqual(5)

        taskToChange.name = 'Some updated task name'
        store.commit('addTasks', [taskToChange])

        expect(state.tasks.length).toEqual(5)

        const storedTasks = store.getters['tasks']
        const changedTask = storedTasks.find(t => t.id == taskToChange.id)
        expect(changedTask).toEqual(taskToChange)
        expect(changedTask.name).toEqual(taskToChange.name)
      })

      it('should throw an error if passed an invalid data type', () => {
        const toPass = { 1: 'foo', 2: 'bar' }
        expect(() => store.commit('addTasks', toPass)).toThrow(
          'passed null or invalid Tasks; Expected Array, got: ' + toPass
        )
      })
    })

    const dataMutations = ['Flows', 'Projects', 'Tasks']

    dataMutations.forEach(d => {
      const ref = d.toLowerCase()
      const error = `passed invalid ${d}; Expected Array, got: `

      describe(`set${d}`, () => {
        it(`should set the ${d} array`, () => {
          const generated = generators[
            ref.substring(0, d.length - 1) // Uncapitalize and remove plural
          ](5) // Creates a new random array of objects
          store.commit(`set${d}`, generated)
          expect(store.getters[ref]).toEqual(generated)
          expect(store.getters[ref].length).toEqual(5)
        })

        it(`should throw an error if passed an invalid ${d} data type`, () => {
          const toPass = { 1: 'foo', 2: 'bar' }
          expect(() => store.commit(`set${d}`, toPass)).toThrow(error + toPass)
        })

        it(`should throw an error if passed no ${d}`, () => {
          expect(() => store.commit(`set${d}`)).toThrow(error + 'undefined')
        })
      })

      describe(`unset${d}`, () => {
        let state, store
        beforeEach(() => {
          state = setState()
          store = new Vuex.Store({
            state: state,
            getters: data.getters,
            actions: data.actions,
            mutations: data.mutations
          })
        })

        it(`should unset the ${d} array`, () => {
          expect(store.getters[ref][0].id).toEqual(state[ref][0].id)

          store.commit(`unset${d}`)
          expect(store.getters[ref]).toEqual(null)
        })
      })
    })
  })

  describe('Actions', () => {
    let state, store
    beforeEach(() => {
      state = unsetState()
      store = new Vuex.Store({
        state: state,
        getters: data.getters,
        actions: data.actions,
        mutations: data.mutations
      })
    })

    describe('resetActiveData', () => {
      it('removes all active* data', () => {
        state = setState()
        store = new Vuex.Store({
          state: state,
          getters: data.getters,
          actions: data.actions,
          mutations: data.mutations
        })

        expect(store.getters['activeFlow'].id).toEqual(state['activeFlow'].id)
        expect(store.getters['activeProject'].id).toEqual(
          state['activeProject'].id
        )
        expect(store.getters['activeTask'].id).toEqual(state['activeTask'].id)

        store.dispatch('resetActiveData')

        expect(store.getters['activeFlow']).toEqual(null)
        expect(store.getters['activeProject']).toEqual(null)
        expect(store.getters['activeTask']).toEqual(null)
      })
    })

    describe('resetData', () => {
      it('removes all data', () => {
        state = setState()
        store = new Vuex.Store({
          state: state,
          getters: data.getters,
          actions: data.actions,
          mutations: data.mutations
        })

        expect(store.getters['activeFlow'].id).toEqual(state['activeFlow'].id)
        expect(store.getters['activeProject'].id).toEqual(
          state['activeProject'].id
        )
        expect(store.getters['activeTask'].id).toEqual(state['activeTask'].id)

        expect(Object.keys(store.getters['flows']).length).toEqual(5)
        expect(store.getters['projects'].length).toEqual(5)
        expect(store.getters['tasks'].length).toEqual(5)

        expect(Object.keys(store.getters['flows'])[0]).toEqual(
          Object.keys(state['flows'])[0]
        )
        expect(store.getters['projects'][0].id).toEqual(state['projects'][0].id)
        expect(store.getters['tasks'][0].id).toEqual(state['tasks'][0].id)

        store.dispatch('resetData')

        expect(store.getters['activeFlow']).toEqual(null)
        expect(store.getters['activeProject']).toEqual(null)
        expect(store.getters['activeTask']).toEqual(null)
        expect(store.getters['flows']).toStrictEqual({})
        expect(store.getters['projects']).toEqual(null)
        expect(store.getters['tasks']).toEqual(null)
      })
    })

    describe('activating projects, flows, and tasks', () => {
      let state, store
      beforeEach(() => {
        state = unsetState()
        store = new Vuex.Store({
          state: state,
          getters: data.getters,
          actions: data.actions,
          mutations: data.mutations
        })
      })

      describe('activateFlow', () => {
        beforeEach(() => {
          state = setState()
          store = new Vuex.Store({
            state: state,
            getters: data.getters,
            actions: data.actions,
            mutations: data.mutations
          })
        })

        it('sets the activeFlow from the store when the flow exists in the store', async () => {
          expect(store.getters['activeFlow'].id).toEqual(state['activeFlow'].id)

          const id = Object.keys(store.getters['flows']).find(
            id => id !== state['activeFlow'].id
          ) // Find the first flow in the store that isn't the activeFlow

          expect(store.getters['activeFlow'].id).not.toEqual(id)

          await store.dispatch('activateFlow', id)

          expect(store.getters['activeFlow'].id).toEqual(id)
        })

        it('sets the activeProject after setting the activeFlow', async () => {
          state = unsetState()
          const spy = jest.spyOn(data.actions, 'activateProject')

          store = new Vuex.Store({
            state: state,
            getters: data.getters,
            actions: data.actions,
            mutations: data.mutations
          })
          const flows = generators['flow'](5)

          store.commit('setFlows', flows)
          expect(Object.values(store.getters['flows'])).toEqual(flows)

          expect(store.getters['activeFlow']).toEqual(null)
          expect(store.getters['activeProject']).toEqual(null)

          const id = 'f2'
          const project_id = flows.find(f => f.id == id).project_id
          store.commit('setProjects', [
            { id: project_id, name: 'Some Project Name' }
          ])

          await store.dispatch('activateFlow', id)
          await expect(data.actions['activateProject']).toHaveBeenCalledTimes(1)

          expect(store.getters['activeFlow'].id).toEqual(id)
          expect(store.getters['activeProject'].id).toEqual(project_id)

          spy.mockRestore()
        })

        it('sets the activeFlow from a flow_group_id', async () => {
          expect(store.getters['activeFlow'].id).toEqual(state['activeFlow'].id)

          const id = 'fg-111' // Known flow group id

          await store.dispatch('activateFlow', id)

          expect(store.getters['activeFlow'].id).toEqual('f-111')
        })

        it("re-fetches and sets both the flows and the activeFlow if the flow doesn't exist in the store", async () => {
          expect(store.getters['activeFlow'].id).toEqual(state['activeFlow'].id)

          const id = 'f-111' // Known flow id

          expect(state['activeFlow'].id).not.toEqual(id)

          expect(store.getters['flows'][id]).toBeFalsy()

          await store.dispatch('activateFlow', id)

          expect(store.getters['activeFlow'].id).toEqual(id)
        })

        it("throws an error if the flow doesn't exist in the store and can't be fetched", async () => {
          expect(Object.values(store.getters['flows'])).toEqual(state['flows'])

          const id = 'f-222' // Unknown flow id

          expect(store.getters['flows'][id]).toBeFalsy()

          expect(store.dispatch('activateFlow', id)).rejects.toThrow(
            "Couldn't retrieve flow."
          )
        })
      })

      describe('activateProject', () => {
        beforeEach(() => {
          state = setState()
          store = new Vuex.Store({
            state: state,
            getters: data.getters,
            actions: data.actions,
            mutations: data.mutations
          })
        })

        it('sets the activeProject from the store when the project exists in the store', async () => {
          expect(store.getters['activeProject'].id).toEqual(
            state['activeProject'].id
          )

          const id = store.getters['projects'].find(
            p => p.id !== state['activeProject'].id
          ).id // Find the first project in the store that isn't the activeProject

          expect(store.getters['activeProject'].id).not.toEqual(id)

          await store.dispatch('activateProject', id)

          expect(store.getters['activeProject'].id).toEqual(id)
        })

        it("re-fetches and sets both the projects and the activeProject if the project doesn't exist in the store", async () => {
          expect(store.getters['activeProject'].id).toEqual(
            state['activeProject'].id
          )

          const id = 'p-111' // Known project id

          expect(state['activeProject'].id).not.toEqual(id)

          expect(store.getters['projects'].find(p => p.id == id)).toBeFalsy()

          await store.dispatch('activateProject', id)

          expect(store.getters['activeProject'].id).toEqual(id)
        })

        it("throws an error if the project doesn't exist in the store and can't be fetched", async () => {
          expect(store.getters['projects']).toEqual(state['projects'])

          const id = 'p-222' // Unknown project id

          expect(store.getters['projects'].find(p => p.id == id)).toBeFalsy()

          expect(store.dispatch('activateProject', id)).rejects.toThrow(
            "Couldn't retrieve project."
          )
        })
      })

      describe('activateTask', () => {
        beforeEach(() => {
          state = setState()
          store = new Vuex.Store({
            state: state,
            getters: data.getters,
            actions: data.actions,
            mutations: data.mutations
          })
        })

        it('sets the activeTask from the store when the task exists in the store', async () => {
          expect(store.getters['activeTask'].id).toEqual(state['activeTask'].id)

          const id = store.getters['tasks'].find(
            p => p.id !== state['activeTask'].id
          ).id // Find the first task in the store that isn't the activeTask

          expect(store.getters['activeTask'].id).not.toEqual(id)

          await store.dispatch('activateTask', id)

          expect(store.getters['activeTask'].id).toEqual(id)
        })

        it('sets the activeFlow and activeProject after setting the activeTask', async () => {
          state = unsetState()
          const flowSpy = jest.spyOn(data.actions, 'activateFlow')
          const projectSpy = jest.spyOn(data.actions, 'activateProject')

          store = new Vuex.Store({
            state: state,
            getters: data.getters,
            actions: data.actions,
            mutations: data.mutations
          })
          const tasks = generators['task'](5)

          store.commit('setTasks', tasks)
          expect(store.getters['tasks']).toEqual(tasks)

          expect(store.getters['activeTask']).toEqual(null)
          expect(store.getters['activeFlow']).toEqual(null)
          expect(store.getters['activeProject']).toEqual(null)

          const id = 't2'
          const flow_id = tasks.find(f => f.id == id).flow_id
          const project_id = 'p-444'
          store.commit('setFlows', [
            {
              id: flow_id,
              flow_group_id: 'fg-444',
              name: 'Some Flow Name',
              project_id: project_id
            }
          ])
          store.commit('setProjects', [
            { id: project_id, name: 'Some Project Name' }
          ])

          await store.dispatch('activateTask', id)
          await expect(data.actions['activateFlow']).toHaveBeenCalledTimes(1)
          await expect(data.actions['activateProject']).toHaveBeenCalledTimes(1)

          expect(store.getters['activeTask'].id).toEqual(id)
          expect(store.getters['activeFlow'].id).toEqual(flow_id)
          expect(store.getters['activeProject'].id).toEqual(project_id)

          flowSpy.mockRestore()
          projectSpy.mockRestore()
        })

        it("re-fetches and sets both the tasks and the activeTask if the task doesn't exist in the store", async () => {
          expect(store.getters['activeTask'].id).toEqual(state['activeTask'].id)

          const id = 't-111' // Known task id

          expect(state['activeTask'].id).not.toEqual(id)

          expect(store.getters['tasks'].find(p => p.id == id)).toBeFalsy()

          await store.dispatch('activateTask', id)

          expect(store.getters['activeTask'].id).toEqual(id)
        })

        it("throws an error if the task doesn't exist in the store and can't be fetched", async () => {
          expect(store.getters['tasks']).toEqual(state['tasks'])

          const id = 't-222' // Unknown task id

          expect(store.getters['tasks'].find(p => p.id == id)).toBeFalsy()

          expect(store.dispatch('activateTask', id)).rejects.toThrow(
            "Couldn't retrieve task."
          )
        })
      })
    })
  })
})
