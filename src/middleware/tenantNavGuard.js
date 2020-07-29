import store from '@/store/index'

const tenantNavGuard = async (to, from, next) => {
  if (!store.getters['api/connected']) return next()

  if (store.getters['tenant/tenants']?.length === 0) {
    await store.dispatch('tenant/getTenants')
  }

  const passedTenantSlug = to.params.tenant
  const tenantIsSet = store.getters['tenant/tenantIsSet']
  const tenantExists = !!store.getters['tenant/tenants'].find(
    tenant => tenant.slug == passedTenantSlug
  )
  const currentTenant = store.getters['tenant/tenant']
  const defaultTenantSlug = store.getters['tenant/defaultTenant']?.slug

  // If a slug is passed, use the slug
  // and reset the tenant
  if (passedTenantSlug) {
    if (tenantIsSet && passedTenantSlug == currentTenant.slug) return next()

    // ... but only if the tenant exists
    if (tenantExists) {
      await store.dispatch('tenant/setCurrentTenant', passedTenantSlug)
      return next()
    } else if (defaultTenantSlug) {
      await store.dispatch('tenant/setCurrentTenant', defaultTenantSlug)
      return next()
    } else {
      return next({
        name: 'start'
      })
    }
  }

  // Else if a tenant is set, use the tenant
  // the API will reset the default membership id (for Cloud)
  if (tenantIsSet) {
    return next({
      name: to.name,
      replace: true,
      params: { ...to.params, tenant: currentTenant.slug },
      query: to.query
    })
  }

  // Else if a default tenant slug exists
  // whether from the tenant associated with the default membership id or
  // the first tenant to which we have access...
  // use that
  if (defaultTenantSlug) {
    return next({
      name: to.name,
      replace: true,
      params: { ...to.params, tenant: defaultTenantSlug },
      query: to.query
    })
  }

  // Otherwise, we direct to the get started page because we are either not
  // connected to an API or we have no access to a tenant
  // Note: this should only be possible in Server
  return next({
    name: 'start'
  })
}

export default tenantNavGuard
