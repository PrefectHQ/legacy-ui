import { login, switchTenant, commitTokens } from '@/auth/index.js'
import { CreatePrefectUI } from '@/app.js'
import store from '@/store'
import jwt_decode from 'jwt-decode'

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

  tenant.role =
    process.env.VUE_APP_BACKEND === 'CLOUD'
      ? store.getters['user/memberships'].find(
          membership => membership.tenant.id == tenant.id
        )?.role_detail?.name
      : 'TENANT_ADMIN'

  store.commit('tenant/setTenant', tenant)

  await store.dispatch('license/getLicense')
}

let loading = false
export const start = async () => {
  if (window.location.pathname?.includes('logout')) {
    CreatePrefectUI()
    return
  }

  const start0 = performance.now()
  if (process.env.VUE_APP_BACKEND === 'CLOUD') {
    // we run this when the application starts or a user returns to the page after some time away
    // this logs into the default tenant so that we can fetch information we need
    // if the user is requesting a different tenant (indicated by the URL),
    // we swap out these tokens later
    loading = true
    const tokens = await login()
    commitTokens(tokens)
    loading = false
  } else {
    // If we're on Server we fetch settings
    window.prefect_ui_settings = await fetch('/settings.json')
      .then(response => response.json())
      .then(data => data)
  }

  // This is a good place to implement browser-side InnoDB or other caching
  await Promise.all([
    store.dispatch('user/getUser'),
    store.dispatch('tenant/getTenants')
  ])

  await setStartupTenant()

  const start1 = performance.now()

  // eslint-disable-next-line no-console
  console.log('Start total: ', start1 - start0)
  CreatePrefectUI()
}

start()

// ******************************************************************************************
// Browser visibility API handler for auth
// ******************************************************************************************

// Visibility change properties vary between browsers
let hidden, visibilityChange

const handleVisibilityChange = async () => {
  if (store.getters['api/isServer'] || loading) return

  loading = true

  if (!document[hidden]) {
    if (
      !store.getters['auth/isAuthenticated'] ||
      !store.getters['auth/isAuthorized']
    ) {
      const tokens = await login()
      commitTokens(tokens)
    }
  }

  loading = false
}

if (window) {
  if (typeof document.hidden !== 'undefined') {
    // Opera 12.10 and Firefox 18 and later
    hidden = 'hidden'
    visibilityChange = 'visibilitychange'
  } else if (typeof document.msHidden !== 'undefined') {
    hidden = 'msHidden'
    visibilityChange = 'msvisibilitychange'
  } else if (typeof document.webkitHidden !== 'undefined') {
    hidden = 'webkitHidden'
    visibilityChange = 'webkitvisibilitychange'
  }
  window.addEventListener(visibilityChange, handleVisibilityChange, false)
}
