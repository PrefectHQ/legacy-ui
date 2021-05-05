import { login, switchTenant } from '@/auth/login.js'
import { CreatePrefectUI } from '@/app.js'
import store from '@/store'
import jwt_decode from 'jwt-decode'

export const logOut = async () => {
  // try sending the request to the token worker
  // if we have a service worker, ping that for a token
  // otherwise we go through the okta logout process directly
}

export const commitTokens = tokens => {
  const authToken = tokens.authorizationTokens.access_token
  const expiry = new Date(tokens.authorizationTokens.expires_at).getTime()
  const idToken = tokens.idToken
  const refreshToken = tokens.authorizationTokens.refresh_token

  if (idToken) {
    store.commit('auth/idToken', idToken.value)
    store.commit('auth/idTokenExpiry', idToken.expiresAt * 1000)
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
  const slugTenant = tenants.find(t => t.slug == slug)

  // If there's no slug in the URL or the token
  // tenant matches the intended tenant, we can set the current tenant
  // to the token tenant
  let tenant
  if (!slug || tokenTenant.slug == slug || !slugTenant) {
    tenant = tokenTenant
  } else {
    tenant = slugTenant
    const tokens = await switchTenant(tenant.id)
    commitTokens(tokens)
  }

  store.commit('tenant/setTenant', tenant)

  await store.dispatch('license/getLicense')
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

  await Promise.all([
    store.dispatch('user/getUser'),
    store.dispatch('tenant/getTenants')
  ])

  await setStartupTenant()

  CreatePrefectUI()
}

start()
