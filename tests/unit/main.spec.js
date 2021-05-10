jest.mock('@/app.js', () => ({
  CreatePrefectUI: jest.fn()
}))
jest.mock('jwt-decode')
jest.mock('@/auth/index.js', () => ({
  login: jest.fn(),
  switchTenant: jest.fn(),
  commitTokens: jest.fn()
}))

const url = 'https://cloud.prefect.io'
Object.defineProperty(window, 'location', {
  value: {
    pathname: url
  }
})

import store from '@/store'

import { CreatePrefectUI } from '@/app.js'
import { login, switchTenant, commitTokens } from '@/auth/index.js'

describe('Main', () => {
  it('exports the setStartupTenant method', () => {
    const mod = require('@/main.js')

    expect(mod.setStartupTenant).toBeDefined()
  })
  it('exports the start method', () => {
    const mod = require('@/main.js')

    expect(mod.start).toBeDefined()
  })

  describe('the start method', () => {
    const clearMocks = () => {}

    let mod

    beforeEach(() => {
      mod = require('@/main.js')

      // This is required before each test after import
      // because the script calls the start method
      // on load
      CreatePrefectUI.mockClear()
    })

    afterEach(clearMocks)

    it('immediately creates the application if the window location is the logout route', async () => {
      window.location.pathname = 'https://cloud.prefect.io/logout'
      await mod.start()

      expect(CreatePrefectUI).toHaveBeenCalledTimes(1)
    })

    // TODO: Add more tests for the next steps in startup
    // This is complicated because of all the dependencies that stem from this method
    // it('calls the login method when the backend is CLOUD', async () => {
    //   window.location.pathname = 'https://cloud.prefect.io'
    //   process.env.VUE_APP_BACKEND = 'CLOUD'
    //   store.commit('auth/authorizationToken', {
    //     value: 'foo',
    //     tenant_id: 'bar'
    //   })

    //   expect(process.env.VUE_APP_BACKEND).toEqual('CLOUD')

    //   await mod.start()

    //   expect(login).toHaveBeenCalledTimes(1)
    // })
  })
})
