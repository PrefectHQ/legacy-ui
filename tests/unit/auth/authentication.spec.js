jest.mock('@okta/okta-auth-js')
import {
  isLoginRedirect,
  parseFromUrl,
  getTokens,
  getWithRedirect,
  setTokens,
  MOCK_TOKEN_PAYLOAD,
  expiredIdToken,
  renew
} from '@okta/okta-auth-js'

describe('the authentication module', () => {
  it('exports the auth client', async () => {
    const mod = require('@/auth/authentication.js')

    expect(mod.authClient).toBeDefined()
  })

  it('exports an authenticate method', async () => {
    const mod = require('@/auth/authentication.js')

    expect(mod.authenticate).toBeDefined()
  })

  describe('the authenticate method', () => {
    const clearMocks = () => {
      isLoginRedirect.mockClear()
      parseFromUrl.mockClear()
      setTokens.mockClear()
      getTokens.mockClear()
      renew.mockClear()
      getWithRedirect.mockClear()
      sessionStorage.setItem.mockClear()
      sessionStorage.getItem.mockClear()
      sessionStorage.removeItem.mockClear()
    }

    let mod

    beforeEach(() => {
      mod = require('@/auth/authentication.js')
    })

    afterEach(clearMocks)

    it('calls the isLoginRedirect method', async () => {
      await mod.authenticate()

      expect(isLoginRedirect).toHaveBeenCalledTimes(1)
    })

    it('checks session storage for a redirect route', async () => {
      await mod.authenticate()

      expect(sessionStorage.getItem).toHaveBeenCalledWith('redirectRoute')
    })

    describe('(login redirect)', () => {
      let mod

      beforeEach(() => {
        mod = require('@/auth/authentication.js')
        isLoginRedirect.mockReturnValueOnce(true)
      })

      afterEach(clearMocks)

      it('attempts to get tokens from the URL on login redirect', async () => {
        await mod.authenticate()

        expect(parseFromUrl).toHaveBeenCalledTimes(1)
      })

      it('calls the set tokens method when parsing tokens from the url', async () => {
        const tokens = MOCK_TOKEN_PAYLOAD.tokens

        await mod.authenticate()

        // The parseFromUrl method is mocked to return the MOCK_TOKEN_PAYLOAD by default
        expect(setTokens).toHaveBeenCalledWith(tokens)
      })

      it('pushes the redirect route to browser history', async () => {
        // This is necessary for us to get the args from history.replaceState
        jest.spyOn(window.history, 'replaceState')
        sessionStorage.getItem.mockReturnValueOnce('/foo')

        await mod.authenticate()

        // The parseFromUrl method is mocked to return the MOCK_TOKEN_PAYLOAD by default
        expect(history.replaceState).toHaveBeenCalledWith(null, null, '/foo')
      })

      it('redirects to access denied if we fail to get tokens', async () => {
        window.location.assign = jest.fn()

        parseFromUrl.mockImplementation(() => {
          throw new Error('access denied')
        })

        const authenticate = mod.authenticate()
        await expect(authenticate).rejects.toThrow('Error: access denied')

        expect(window.location.assign).toHaveBeenCalledWith('/access-denied')
        window.location.assign.mockRestore()
      })
    })

    describe('(not login redirect)', () => {
      let mod

      beforeEach(() => {
        mod = require('@/auth/authentication.js')
        isLoginRedirect.mockReturnValueOnce(false)
      })

      afterEach(clearMocks)

      it('does not attempt to get tokens from the URL when not login redirect', async () => {
        await mod.authenticate()

        expect(parseFromUrl).not.toHaveBeenCalled()
      })

      it('sets the redirect route in session storage when unset', async () => {
        sessionStorage.getItem.mockReturnValueOnce(undefined)

        await mod.authenticate()

        expect(sessionStorage.setItem).toHaveBeenCalledWith(
          'redirectRoute',
          window.location.pathname + window.location.search
        )
      })

      it('does not set the redirect route if already set', async () => {
        sessionStorage.getItem.mockReturnValueOnce('/foo-bar')

        await mod.authenticate()

        expect(sessionStorage.setItem).not.toHaveBeenCalled()
      })

      it('attempts to get tokens from the token manager', async () => {
        await mod.authenticate()

        expect(getTokens).toHaveBeenCalledTimes(1)
      })

      it('calls the set tokens method when get tokens from the token manager', async () => {
        const tokens = { idToken: 'foo', accessToken: 'bar' }
        getTokens.mockReturnValueOnce(tokens)

        await mod.authenticate()

        expect(getTokens).toHaveBeenCalledTimes(1)
        expect(setTokens).toHaveBeenCalledWith(tokens)
      })

      it('gets tokens with redirect if none are returned from the token manager', async () => {
        getTokens.mockReturnValueOnce(null)

        await mod.authenticate()

        expect(getWithRedirect).toHaveBeenCalledTimes(1)
      })

      it('attempts to renew expired id tokens', async () => {
        const tokens = { accessToken: 'bar', idToken: expiredIdToken }
        getTokens.mockReturnValueOnce(tokens)

        await mod.authenticate()

        expect(renew).toHaveBeenCalledTimes(1)
      })

      it('calls get with redirect if token renewal throws an error', async () => {
        const tokens = { accessToken: 'bar', idToken: expiredIdToken }
        getTokens.mockReturnValueOnce(tokens)
        renew.mockImplementation(() => {
          throw new Error('I fail on purpose')
        })

        await mod.authenticate()

        expect(getWithRedirect).toHaveBeenCalledTimes(1)
      })
    })
  })
})
