jest.mock('@/auth/authentication.js', () => ({
  authenticate: jest.fn(),
  authClient: {
    tokenManager: {
      on: jest.fn()
    }
  },
  signOut: jest.fn()
}))

jest.mock('@/main', () => {
  return {
    TokenWorker: {
      postMessage: jest.fn()
    }
  }
})

jest.mock('@/auth/authorization.js', () => ({
  authorize: jest.fn(),
  authorizeTenant: jest.fn(),
  refreshTokens: jest.fn()
}))

jest.mock('@/workers/util/worker-interface.js', () => ({
  promiseChannel: jest.fn()
}))

const start = jest.fn()
const postMessage = jest.fn()
const onmessage = jest.fn()

class SharedWorker {
  defaultOptions = { type: 'classic', credentials: 'omit', name: null }

  constructor(url, name, options = {}) {
    this.url = url
    this.name = name
    this.options = { ...this.defaultOptions, ...options }
  }

  get port() {
    return {
      start: start,
      postMessage: postMessage,
      onmessage: onmessage
    }
  }
}

describe('the auth module', () => {
  let mod

  const clearMocks = () => {
    mod = undefined
  }

  beforeEach(() => {
    jest.resetModules()
    // global.SharedWorker = SharedWorker
  })

  afterEach(clearMocks)

  it('exports a login method', async () => {
    mod = require('@/auth/index.js')

    expect(mod.login).toBeDefined()
  })

  it('exports a switchTenant method', async () => {
    mod = require('@/auth/index.js')

    expect(mod.switchTenant).toBeDefined()
  })

  it('exports a logout method', async () => {
    mod = require('@/auth/index.js')

    expect(mod.logout).toBeDefined()
  })

  it('exports an unsetTokens method', async () => {
    mod = require('@/auth/index.js')

    expect(mod.unsetTokens).toBeDefined()
  })

  it('exports a commitTokens method', async () => {
    mod = require('@/auth/index.js')

    expect(mod.commitTokens).toBeDefined()
  })

  describe('browser has shared worker support', () => {
    let mod, promiseChannel, authenticate, TokenWorker
    const clearMocks = () => {
      global.SharedWorker = SharedWorker
      jest.resetModules()
      promiseChannel?.mockClear()
      authenticate?.mockClear()

      promiseChannel = require('@/workers/util/worker-interface.js')
        .promiseChannel

      authenticate = require('@/auth/authentication.js').authenticate

      mod = require('@/auth/index.js')
      TokenWorker = mod.TokenWorker
    }

    beforeEach(clearMocks)

    it('exports a shared token worker', () => {
      expect(TokenWorker).toBeDefined()
    })

    describe('the login method', () => {
      beforeEach(clearMocks)

      it('calls the promiseChannel method when a token worker exists', async () => {
        await mod.login()
        expect(promiseChannel).toHaveBeenCalledWith(TokenWorker, 'login')
      })

      describe('expired id token', () => {
        beforeEach(clearMocks)

        it('calls the authenticate method', async () => {
          const expiration = Date.now() / 1000 - 1000
          const idToken = {
            value: 'foo.bar',
            expiresAt: expiration
          }
          promiseChannel.mockReturnValueOnce(idToken)
          await mod.login()

          expect(expiration).toBeLessThan(Date.now())
          expect(authenticate).toHaveBeenCalledTimes(1)
        })
      })

      describe('no id token', () => {
        beforeEach(clearMocks)

        it('calls the authenticate method', async () => {
          const idToken = undefined
          promiseChannel.mockReturnValueOnce(idToken)
          await mod.login()
          expect(authenticate).toHaveBeenCalledTimes(1)
        })
      })

      it('posts the id token payload to the token worker, when none exists', async () => {
        const idToken = { value: 'foo.bar' }
        promiseChannel.mockReturnValueOnce(undefined)
        authenticate.mockReturnValueOnce({ idToken: idToken })

        await mod.login()

        expect(authenticate).toHaveBeenCalledTimes(1)
        expect(postMessage).toHaveBeenCalledWith({
          type: 'idToken',
          payload: idToken
        })
        expect(promiseChannel).toHaveBeenCalledWith(
          TokenWorker,
          'authorize',
          idToken.value
        )
      })
    })
  })

  describe('browser does not have shared worker support', () => {
    let mod, promiseChannel, authenticate, authorize, TokenWorker
    const clearMocks = () => {
      global.SharedWorker = undefined
      jest.resetModules()
      promiseChannel?.mockClear()
      authenticate?.mockClear()

      promiseChannel = require('@/workers/util/worker-interface.js')
        .promiseChannel

      authenticate = require('@/auth/authentication.js').authenticate
      authorize = require('@/auth/authorization.js').authorize

      mod = require('@/auth/index.js')
      TokenWorker = mod.TokenWorker
    }

    beforeEach(clearMocks)

    it('does not export a shared token worker', () => {
      expect(TokenWorker).toBeUndefined()
    })

    it('calls the authenticate method', async () => {
      const idToken = { value: 'foo.bar' }
      authenticate.mockReturnValueOnce({ idToken: idToken })
      authorize.mockReturnValueOnce({
        expires_at: Date.now() + 5000,
        access_token: null,
        refresh_token: null
      })
      await mod.login()

      expect(TokenWorker).toBeUndefined()
      expect(authenticate).toHaveBeenCalledWith()
    })
  })
})
