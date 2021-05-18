// const query = jest.fn()
// const mutate = jest.fn()

jest.mock('@/apollo.js')

import { mutate } from '@/apollo.js'

jest.mock('@/graphql/log-in.gql', () => 'log in string')
jest.mock('@/graphql/refresh-token.gql', () => 'refresh token string')
jest.mock('@/graphql/Tenant/tenant-token.gql', () => 'switch tenant string')

const headers = {
  'X-PREFECT-UI': true,
  'X-Backend': 'cloud'
}

describe('the authorization module', () => {
  it('exports the authorize method', () => {
    const mod = require('@/auth/authorization.js')

    expect(mod.authorize).toBeDefined()
  })

  it('exports the refreshTokens method', () => {
    const mod = require('@/auth/authorization.js')

    expect(mod.refreshTokens).toBeDefined()
  })

  it('exports the authorizeTenant method', () => {
    const mod = require('@/auth/authorization.js')

    expect(mod.authorizeTenant).toBeDefined()
  })

  describe('the authorize method', () => {
    const clearMocks = () => {
      mutate.mockClear()
    }

    let mod

    beforeEach(() => {
      mod = require('@/auth/authorization.js')
    })

    afterEach(clearMocks)

    it('throws an error when no id token is passed', async () => {
      await expect(mod.authorize()).rejects.toThrow(
        'No ID token passed to authorize'
      )
    })

    it('calls the client mutate method', async () => {
      const idToken = 'foo'
      await mod.authorize(idToken)

      expect(mutate).toHaveBeenCalledWith({
        mutation: require('@/graphql/log-in.gql'),
        variables: {
          input: { id_token: idToken }
        },
        context: {
          headers: headers
        },
        errorPolicy: 'all',
        fetchPolicy: 'no-cache'
      })

      expect(mutate).toHaveBeenCalledTimes(1)
    })

    it('returns data from the log in mutation', async () => {
      const mockReturn = {
        data: {
          log_in: {
            access_token: 'bar',
            refresh_token: 'batz',
            expires_at: 99999
          }
        }
      }
      mutate.mockReturnValueOnce(mockReturn)

      const response = await mod.authorize('foo')

      expect(response).toStrictEqual(mockReturn.data.log_in)
    })
  })

  describe('the refreshTokens method', () => {
    const clearMocks = () => {
      mutate.mockClear()
    }

    let mod

    beforeEach(() => {
      mod = require('@/auth/authorization.js')
    })

    afterEach(clearMocks)

    it('throws an error when no access token or refresh token is passed', async () => {
      const error = 'No access or refresh token passed to refreshTokens'
      await expect(mod.refreshTokens()).rejects.toThrow(error)
      await expect(mod.refreshTokens('foo', undefined)).rejects.toThrow(error)
      await expect(mod.refreshTokens(undefined, 'bar')).rejects.toThrow(error)
    })

    it('calls the client mutate method', async () => {
      const accessToken = 'foo'
      const refreshToken = 'bar'
      await mod.refreshTokens(accessToken, refreshToken)

      expect(mutate).toHaveBeenCalledWith({
        mutation: require('@/graphql/refresh-token.gql'),
        variables: {
          input: { access_token: accessToken }
        },
        context: {
          headers: {
            ...headers,
            authorization: `Bearer ${refreshToken}`
          }
        },
        fetchPolicy: 'no-cache'
      })

      expect(mutate).toHaveBeenCalledTimes(1)
    })

    it('returns data from the refresh token mutation', async () => {
      const mockReturn = {
        data: {
          refresh_token: {
            access_token: 'bar',
            refresh_token: 'batz',
            expires_at: 99999
          }
        }
      }
      mutate.mockReturnValueOnce(mockReturn)

      const response = await mod.refreshTokens('foo', 'bar')

      expect(response).toStrictEqual(mockReturn.data.refresh_token)
    })
  })

  describe('the authorizeTenant method', () => {
    const clearMocks = () => {
      mutate.mockClear()
    }

    let mod

    beforeEach(() => {
      mod = require('@/auth/authorization.js')
    })

    afterEach(clearMocks)

    it('throws an error when no access token or refresh token is passed', async () => {
      const error = 'No access token or no tenant id passed to authorizeTenant'

      await expect(mod.authorizeTenant()).rejects.toThrow(error)
      await expect(mod.authorizeTenant('foo', undefined)).rejects.toThrow(error)
      await expect(mod.authorizeTenant(undefined, 'bar')).rejects.toThrow(error)
    })

    it('calls the client mutate method', async () => {
      const accessToken = 'foo'
      const tenantId = 'bar'
      await mod.authorizeTenant(accessToken, tenantId)

      expect(mutate).toHaveBeenCalledWith({
        mutation: require('@/graphql/Tenant/tenant-token.gql'),
        variables: {
          tenantId: tenantId
        },
        context: {
          headers: {
            ...headers,
            authorization: `Bearer ${accessToken}`
          }
        },
        fetchPolicy: 'no-cache'
      })

      expect(mutate).toHaveBeenCalledTimes(1)
    })

    it('returns data from the switch tenant mutation', async () => {
      const mockReturn = {
        data: {
          switch_tenant: {
            access_token: 'bar',
            refresh_token: 'batz',
            expires_at: 99999
          }
        }
      }
      mutate.mockReturnValueOnce(mockReturn)

      const response = await mod.authorizeTenant('foo', 'bar')

      expect(response).toStrictEqual(mockReturn.data.switch_tenant)
    })
  })
})
