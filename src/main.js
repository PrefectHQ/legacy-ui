import { login, switchTenant } from '@/auth/login.js'
import store from '@/store'
import jwt_decode from 'jwt-decode'

export const logOut = async () => {
  // try sending the request to the token worker
  // if we have a service worker, ping that for a token
  // otherwise we go through the okta logout process directly
}

export const commitTokens = tokens => {
  console.log('got tokens', tokens)

  const authToken = tokens.authorizationTokens.access_token
  const expiry = new Date(tokens.authorizationTokens.expires_at).getTime()
  const idToken = tokens.idToken
  const refreshToken = tokens.authorizationTokens.refresh_token

  console.log('auth token', jwt_decode(authToken))

  if (idToken) {
    store.commit('auth/idToken', idToken.value)
    store.commit('auth/idTokenExpiry', idToken.expiresAt)
    store.commit('auth/user', idToken.claims)
    store.commit('user/setOktaUser', idToken.claims)
  }

  if (tokens.authorizationTokens) {
    store.commit('auth/authorizationToken', authToken)
    store.commit('auth/refreshToken', refreshToken)

    store.commit('auth/authorizationTokenExpiry', expiry)
    store.commit('auth/refreshTokenExpiry', jwt_decode(refreshToken).exp * 1000)
  }
}

export const setStartupTenant = async () => {
  const path = window.location.pathname
  const split = path.split('/')
  const slug = split?.[1]
  const tokenTenantId = jwt_decode(store.getters['auth/authorizationToken'])
    .tenant_id
  const tenants = store.getters['tenant/tenants']
  const tokenTenant = tenants.find(t => t.id == tokenTenantId)

  // If there's no slug in the URL or the token
  // tenant matches the intended tenant, we can set the current tenant
  // to the token tenant
  let tenant
  if (!slug || tokenTenant.slug == slug) {
    tenant = tokenTenant
  } else {
    tenant = tenants.find(t => t.slug == slug)
    const tokens = await switchTenant(tenant.id)
    commitTokens(tokens)
  }

  store.commit('tenant/setTenant', tenant)

  await store.dispatch('license/getLicense')

  console.log(path, split, slug, tokenTenant)
}

const start = async () => {
  console.log('starting')
  if (process.env.VUE_APP_BACKEND === 'CLOUD') {
    // we run this when the application starts or a user returns to the page after some time away
    // this logs into the default tenant so that we can fetch information we need
    // if the user is requesting a different tenant (indicated by the URL),
    // we swap out these tokens later
    const tokens = await login()
    commitTokens(tokens)
  } else {
    // If we're on Server we fetch settings
    window.prefect_ui_settings = await fetch('/settings.json')
      .then(response => response.json())
      .then(data => data)
  }

  const res = await Promise.all([
    store.dispatch('user/getUser'),
    store.dispatch('tenant/getTenants')
  ])

  setStartupTenant()

  console.log(res)
}

start()
