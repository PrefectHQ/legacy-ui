const raw_jwt =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYXdkYXdkYWRhLTQ5NDItNDhhNS04YzY2LWFkYXdkYWRhZCIsInRlbmFudF9pZCI6ImF3ZGF3ZGFkLWQ1NzAtNGYwYy05MTFkLWRjYWFiNWNlYzNkMCIsInJvbGUiOiJURU5BTlRfQURNSU4iLCJpYXQiOjE1Njg4NDAyODQsImV4cCI6MTkzMzk1NDA5OSwianRpIjoiMThiNDRhMTgtNTU2Yy00M2YzLTkxOWEtZDAwOWIwNDIzOTA3IiwiaXNzIjoiUHJlZmVjdCBDbG91ZCIsImF1ZCI6IlByZWZlY3QgQ2xvdWQgQVBJIC0gREVWIn0.iHL0fkdNxMnbRXNJuDwYlvdsaylh1gb-MaRJtuyaZLg'

export const idToken = {
  authorizeUrl: 'https://some.authorization.url/oauth2/authorize',
  claims: {
    sub: 'abc123',
    name: 'Marvin',
    email: 'marvin@theship.com',
    ver: 1,
    iss: 'https://some.issuer.url/oauth2',
    exp: 9999999999,
    iat: 9999999999,
    nonce: 'abc123'
  },
  clientId: '789xyz',
  expiresAt: 9999999999,
  idToken: raw_jwt,
  issuer: 'https://some.issuer.url/oauth2',
  scopes: ['openid', 'profile', 'email'],
  value: raw_jwt
}

export const expiredIdToken = {
  authorizeUrl: 'https://some.authorization.url/oauth2/authorize',
  claims: {
    sub: 'abc123',
    name: 'Marvin',
    email: 'marvin@theship.com',
    ver: 1,
    iss: 'https://some.issuer.url/oauth2',
    exp: 1305389672,
    iat: 1305389671,
    nonce: 'abc123'
  },
  clientId: '789xyz',
  expiresAt: 1305389672,
  idToken: raw_jwt,
  issuer: 'https://some.issuer.url/oauth2',
  scopes: ['openid', 'profile', 'email'],
  value: raw_jwt
}

export const accessToken = {
  authorizeUrl:
    'https://universal.prefect.io/oauth2/aus9ej78aeaYy8Lcf1d6/v1/authorize',
  claims: {
    aud: 'prefect',
    cid: 'abc123',
    exp: 9999999999,
    iat: 9999999999,
    iss: 'https://some.issuer.url/oauth2',
    jti: '456xyz',
    scp: (3)[('email', 'openid', 'profile')],
    sub: 'nicholas@prefect.io',
    uid: '00u9dbxkpyijFlaHF1d6',
    ver: 1
  },
  expiresAt: 9999999999,
  scopes: ['openid', 'profile', 'email'],
  tokenType: 'Bearer',
  userinfoUrl: 'https://some.issuer.url/userinfo',
  value: raw_jwt
}

export const MOCK_TOKEN_PAYLOAD = {
  tokens: { idToken: idToken, accessToken: accessToken }
}

export const parseFromUrl = jest.fn().mockReturnValue(MOCK_TOKEN_PAYLOAD)
export const getTokens = jest.fn().mockReturnValue(MOCK_TOKEN_PAYLOAD.tokens)
export const getWithRedirect = jest.fn().mockReturnValue(MOCK_TOKEN_PAYLOAD)
export const getTokenByKey = jest.fn().mockReturnValue(false)
export const isAuthenticated = jest.fn().mockReturnValue(false)
export const isLoginRedirect = jest.fn().mockReturnValue(false)
export const getUser = jest.fn().mockReturnValue({})
export const setTokens = jest.fn()
export const signOut = jest.fn()
export const on = jest.fn()
export const isPKCESupported = jest.fn().mockReturnValue(true)
export const hasExpired = jest.fn(
  token => token.expiresAt * 1000 < new Date().getTime()
)
export const renew = jest.fn().mockReturnValue(idToken)

export class OktaAuth {
  static features = {
    isPKCESupported: isPKCESupported
  }

  constructor() {
    this.__exists = true

    this.token = {
      getWithRedirect: getWithRedirect,
      parseFromUrl: parseFromUrl
    }

    this.tokenManager = {
      hasExpired: hasExpired,
      getTokens: getTokens,
      get: getTokenByKey,
      renew: renew,
      setTokens: setTokens,
      on: on
    }

    this.isLoginRedirect = isLoginRedirect
    this.isAuthenticated = isAuthenticated

    this.getUser = getUser

    this.signOut = signOut
  }
}

export default OktaAuth
