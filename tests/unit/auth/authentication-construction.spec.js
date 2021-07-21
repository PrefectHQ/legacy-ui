/*

    This tests only the constructor of the OktaAuth client;
    keeping this in a separate file from the rest of the authentication tests
    allows us to work around module import issues. See https://github.com/facebook/jest/issues/2582
    for more details about the other issues and see @/tests/unit/auth/authentication.spec for the rest
    of the authentication tests

*/

jest.mock('@okta/okta-auth-js', () => {
  const OktaAuth = jest.fn().mockImplementation()

  OktaAuth.features = { isPKCESupported: jest.fn(), start: jest.fn() }

  return {
    OktaAuth: OktaAuth
  }
})
import { OktaAuth } from '@okta/okta-auth-js'

describe('authentication', () => {
  it('initializes the auth client', async () => {
    require('@/auth/authentication.js')

    expect(OktaAuth).toHaveBeenCalledTimes(1)
    expect(OktaAuth.features.isPKCESupported).toHaveBeenCalledTimes(1)
  })
})
