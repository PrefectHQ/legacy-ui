import { Client } from '@/apollo.js'

const client = Client('authorization')

const headers = {
  'X-PREFECT-UI': true,
  'X-Backend': 'cloud'
}

export const authorize = async idToken => {
  if (!idToken) {
    throw new Error('No ID token passed to authorize')
  }

  const res = await client.mutate({
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

  return res?.data?.log_in
}

export const refreshTokens = async (accessToken, refreshToken) => {
  if (!accessToken || !refreshToken) {
    throw new Error('No access or refresh token passed to refreshTokens')
  }

  const res = await client.mutate({
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

  return res?.data?.refresh_token
}

export const authorizeTenant = async (accessToken, tenantId) => {
  if (!accessToken || !tenantId) {
    throw new Error('No access token or no tenant id passed to authorizeTenant')
  }

  const res = await client.mutate({
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

  return res?.data?.switch_tenant
}

export const revokeToken = async accessToken => {
  if (!accessToken) {
    throw new Error('No access token passed to revokeTokens')
  }

  const res = await client.mutate({
    mutation: require('@/graphql/log-out.gql'),
    variables: {
      input: { access_token: accessToken }
    },
    errorPolicy: 'all',
    fetchPolicy: 'no-cache'
  })

  return res?.data?.success
}
