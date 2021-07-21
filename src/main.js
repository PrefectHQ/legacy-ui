import { login, switchTenant, commitTokens } from '@/auth/index.js'
import { initializeLogrocket } from '@/plugins/logrocket.js'
import { CreatePrefectUI } from '@/app.js'
import store from '@/store'
import jwt_decode from 'jwt-decode'

export const setStartupTenant = async () => {
  const path = window.location.pathname
  const split = path.split('/')
  const slug = split?.[1]
  const tenants = store.getters['tenant/tenants']
  const slugTenant = tenants.find(t => t.slug == slug)

  let tenant
  if (process.env.VUE_APP_BACKEND === 'SERVER') {
    if (slugTenant) tenant = slugTenant
    else tenant = tenants[0]
  } else {
    const tokenTenantId = jwt_decode(store.getters['auth/authorizationToken'])
      .tenant_id
    const tokenTenant = tenants.find(t => t.id == tokenTenantId)
    let needNewTokens = false

    // If there's no slug in the URL or the token
    // tenant matches the intended tenant, we can set the current tenant
    // to the token tenant; if the token tenant is undefined,
    // we fallback to the user's first tenant. If all of these fail,
    // we redirect to a help screen cause the user can't create a tenant
    // with this token atm
    if (slugTenant) {
      if (tokenTenant?.slug !== slug) needNewTokens = true
      tenant = slugTenant
    } else if (tokenTenant) {
      tenant = tokenTenant
    } else if (tenants?.[0]) {
      tenant = tenants?.[0]
      needNewTokens = true
    } else {
      // redirect to help screen
      window.location.href = '/access-denied'
    }

    // We want to make sure the URL slug matches
    // the tenant slug
    if (slug && slug !== tenant.slug && slugTenant) {
      window.history.pushState('', '', tenant.slug)
    }

    if (needNewTokens) {
      const tokens = await switchTenant(tenant.id)
      commitTokens(tokens)
    }
  }

  tenant.role =
    process.env.VUE_APP_BACKEND === 'CLOUD'
      ? store.getters['user/memberships'].find(
          membership => membership.tenant.id == tenant.id
        )?.role_detail?.name
      : 'TENANT_ADMIN'

  store.commit('tenant/setTenant', tenant)

  if (process.env.VUE_APP_BACKEND === 'CLOUD') {
    await store.dispatch('license/getLicense')
  }
}

let loading = false
export const start = async () => {
  if (
    window.location.pathname?.includes('logout') ||
    window.location.pathname?.includes('access-denied')
  ) {
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

  try {
    // This is a good place to implement browser-side InnoDB or other caching
    await Promise.all([
      store.dispatch('user/getUser'),
      store.dispatch('tenant/getTenants')
    ])

    await setStartupTenant()
  } catch (e) {
    // eslint-disable-next-line no-console
    console.log(e)
  }

  const start1 = performance.now()

  // eslint-disable-next-line no-console
  console.log('Start total: ', start1 - start0)
  CreatePrefectUI()
}

try {
  initializeLogrocket()
} catch (e) {
  console.error('Failed to initialize LogRocket: ', e)
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
