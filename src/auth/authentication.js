import { OktaAuth } from '@okta/okta-auth-js'

const {
  VUE_APP_PUBLIC_CLIENT_ID,
  VUE_APP_PUBLIC_ISSUER,
  VUE_APP_ENVIRONMENT
} = process.env

const storageTypes = ['memory', 'sessionStorage', 'cookie', 'localStorage']

export const authClient = new OktaAuth({
  clientId: VUE_APP_PUBLIC_CLIENT_ID,
  issuer: VUE_APP_PUBLIC_ISSUER,
  redirectUri: window.location.origin,
  postLogoutRedirectUri: window.location.origin + '/logout',
  scopes: ['openid', 'profile', 'email'],
  testing: {
    disableHttpsCheck: VUE_APP_ENVIRONMENT !== 'production'
  },
  tokenManager: {
    autoRenew: true
  },
  pkce: OktaAuth.features.isPKCESupported(),
  storageManager: {
    token: {
      storageType: 'memory',
      storageTypes: storageTypes,
      useMultipleCookies: true
    },
    cache: {
      storageType: 'memory',
      storageTypes: storageTypes
    },
    transaction: {
      storageType: 'memory',
      storageTypes: storageTypes
    }
  }
})

export const authenticate = async () => {
  console.log('authenticating')
  const isLoginRedirect = await authClient.isLoginRedirect()

  if (isLoginRedirect) {
    console.log('is login redirect')
    await authClient.handleLoginRedirect()
    // const { tokens } = await authClient.token.parseFromUrl()
    // authClient.tokenManager.setTokens(tokens)
    // return tokens
  }

  const tokens = await authClient.tokenManager.getTokens()

  if (tokens?.idToken) {
    authClient.tokenManager.setTokens(tokens)
    return tokens
  }

  await authClient.token.getWithRedirect({
    responseType: ['token', 'id_token']
  })
}
