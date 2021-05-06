import { Client } from '@/apollo.js'

const client = Client('authorization')

const headers = {
  'X-PREFECT-UI': true,
  'X-Backend': 'cloud'
}

export const authorize = async idToken => {
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
