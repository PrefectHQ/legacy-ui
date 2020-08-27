/* global jest */

export const handleRedirectCallback = jest.fn()
export const isAuthenticated = jest.fn().mockReturnValue(Math.random() >= 0.5)
export const getUser = jest.fn().mockReturnValue({})
export const getIdTokenClaims = jest.fn().mockReturnValue({ __raw: 'eyj' })
export const getTokenSilently = jest.fn()
export const loginWithRedirect = jest.fn()
export const logout = jest.fn()

export class Auth0Client {
  constructor() {
    this.__exists = true
    this.handleRedirectCallback = handleRedirectCallback
    this.isAuthenticated = isAuthenticated
    this.getUser = getUser
    this.getIdTokenClaims = getIdTokenClaims
    this.loginWithRedirect = loginWithRedirect
    this.logout = logout
    this.getTokenSilently = getTokenSilently
  }
}

export default function createAuth0Client() {
  return new Promise(resolve => resolve(new Auth0Client()))
}
