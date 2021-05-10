import {
  parseFromUrl,
  getTokens,
  getWithRedirect,
  getTokenByKey,
  isAuthenticated,
  isLoginRedirect,
  getUser,
  idToken,
  accessToken,
  signOut
} from '@okta/okta-auth-js'
jest.mock('@okta/okta-auth-js')
