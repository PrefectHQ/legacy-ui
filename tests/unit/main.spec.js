jest.mock('@/app.js', () => ({
  CreatePrefectUI: jest.fn()
}))
jest.mock('jwt-decode')
jest.mock('@/auth/index.js', () => ({
  login: jest.fn(),
  switchTenant: jest.fn(),
  commitTokens: jest.fn()
}))
jest.mock('@/store')
jest.mock('@/plugins/logrocket.js')
jest.mock('logrocket')

import { login } from '@/auth/index.js'

const url = 'https://cloud.prefect.io'
Object.defineProperty(window, 'location', {
  value: {
    pathname: url
  }
})

import { CreatePrefectUI } from '@/app.js'

describe('Main', () => {
  it('says hello', () => {
    expect('hello').toEqual('hello')
  })

  it('exports the setStartupTenant method', () => {
    const mod = require('@/main.js')

    expect(mod.setStartupTenant).toBeDefined()
  })

  it('exports the start method', () => {
    const mod = require('@/main.js')

    expect(mod.start).toBeDefined()
  })

  describe('the start method', () => {
    const clearMocks = () => {
      login.mockClear()
    }

    let mod

    beforeEach(() => {
      mod = require('@/main.js')
      window.location.pathname = null
      localStorage.clear()

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

    it('calls the fallback login method if login throws an error', async () => {
      process.env.VUE_APP_BACKEND = 'CLOUD'
      login.mockRejectedValueOnce()
      await mod.start()

      expect(login).toHaveBeenCalledTimes(2)
      expect(login).toHaveBeenNthCalledWith(1)
      expect(login).toHaveBeenNthCalledWith(2, true)
    })

    it('calls the fallback login method if login takes more than 10 seconds', async () => {
      process.env.VUE_APP_BACKEND = 'CLOUD'
      login.mockImplementationOnce(
        () => new Promise(res => setTimeout(() => res('i was rejected'), 50000))
      )
      const startPromise = mod.start()
      jest.runAllTimers()

      await startPromise

      expect(login).toHaveBeenCalledTimes(2)
      expect(login).toHaveBeenNthCalledWith(1)
      expect(login).toHaveBeenNthCalledWith(2, true)
    })

    it('calls the fallback login method if local storage item is set', async () => {
      process.env.VUE_APP_BACKEND = 'CLOUD'
      localStorage.setItem('prefect_fallback_auth', Date.now())
      const startPromise = mod.start()
      jest.runAllTimers()

      await startPromise

      expect(login).toHaveBeenCalledTimes(1)
      expect(login).toHaveBeenNthCalledWith(1, true)
    })
  })
})
